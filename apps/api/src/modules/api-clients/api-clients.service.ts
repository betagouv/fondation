import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { makeId } from '../../utils/id';
import { Clock } from '../framework/clock';
import { RequestEvent } from '../framework/request-event';

import {
  ApiClient,
  ApiClientConfiguration,
  ApiClientForbidden,
  ApiClientNotRotatable,
  ApiClientNotUpdatable,
  ApiClientUnauthenticated,
  ApiScope,
  CantManageApiClients,
  canonicalIp,
  DEFAULT_LIMITS_PER_MINUTE,
  distinctConfiguration,
  isAllowedIp,
  REFUSALS_LIMIT_PER_MINUTE,
} from './domain/api-client';
import { RateWindow } from './domain/rate-window';
import { ApiClientAlerts } from './infrastructure/api-client-alerts';
import { ApiClientRepository } from './infrastructure/api-client.repository';
import {
  ListApiClientChangesQuery,
  ListedApiClientChangesDto,
} from './infrastructure/queries/list-api-client-changes.query';
import { ListApiClientsQuery, ListedApiClientsDto } from './infrastructure/queries/list-api-clients.query';

@Injectable()
export class ApiClientsService {
  constructor(
    private readonly alerts: ApiClientAlerts,
    private readonly clock: Clock,
    private readonly listApiClientChanges: ListApiClientChangesQuery,
    private readonly listApiClients: ListApiClientsQuery,
    private readonly repository: ApiClientRepository,
    private readonly requestEvent: RequestEvent,
  ) {}

  /** An accepted authentication counts for the client: whoever knows the identifier alone cannot use up its tokens */
  authenticate(command: {
    clientId: string;
    clientSecret: string;
    ip: string;
  }): Promise<{ accessToken: string; expiresIn: number }> {
    const window = new RateWindow(this.clock.now());

    return this.slowingRefusalsDown(window, command.ip, async () => {
      const client = await this.repository.findById(command.clientId);
      if (!client) throw new ApiClientUnauthenticated();
      // Refused too: a wrong secret tried on a known client is the call to find in the logs
      this.requestEvent.set({ 'api_client.id': client.id });

      const token = await this.alertingForbidden(
        window,
        { clientId: client.id, ip: command.ip, route: 'auth' },
        () => client.authenticate({ ip: command.ip, now: window.now, secret: command.clientSecret }),
      );
      await this.limitCall(window, { clientId: client.id, limit: client.authLimitPerMinute, route: 'auth' });
      const saved = await this.repository.saveToken({ clientId: client.id, token });
      if (!saved) throw new ApiClientUnauthenticated();

      return { accessToken: token.token, expiresIn: token.expiresIn };
    });
  }

  authorize(command: { ip: string; scope: ApiScope; token: string | undefined }): Promise<void> {
    const window = new RateWindow(this.clock.now());

    return this.slowingRefusalsDown(window, command.ip, async () => {
      const found = command.token ? await this.repository.findByToken(command.token) : null;
      if (!found) throw new ApiClientUnauthenticated();

      const { client, tokenExpiresAt } = found;
      this.requestEvent.set({ 'api_client.id': client.id });
      const { limitPerMinute } = await this.alertingForbidden(
        window,
        { clientId: client.id, ip: command.ip, route: command.scope },
        () => client.authorize({ ip: command.ip, now: window.now, scope: command.scope, tokenExpiresAt }),
      );
      await this.limitCall(window, { clientId: client.id, limit: limitPerMinute, route: command.scope });
    });
  }

  /**
   * Reports the first 403 of the minute per IP or per route, like the Sentry issues: from an allowed IP, nothing else
   * stops a client calling a route out of its scopes in a loop
   */
  private async alertingForbidden<T>(
    window: RateWindow,
    refusal: { clientId: string; ip: string; route: string },
    check: () => T,
  ): Promise<T> {
    try {
      return check();
    } catch (error) {
      if (error instanceof ApiClientForbidden) {
        const cause = error.reason === 'ip' ? (canonicalIp(refusal.ip) ?? refusal.ip) : refusal.route;
        const count = await this.repository.countCall({
          caller: `client:${refusal.clientId}`,
          minute: window.start,
          route: `forbidden:${cause}`,
        });
        if (count === 1) this.alerts.forbidden({ ...refusal, reason: error.reason });
      }
      throw error;
    }
  }

  /**
   * Checks a caller, whose refusals (401, 403) count for its IP whatever the route and the identifier: an IP over their
   * limit is turned away before anything is checked, a right secret included, so that trying secrets or tokens is
   * slowed down for good. The IPs of the partners are left out (see REFUSALS_LIMIT_PER_MINUTE)
   */
  private async slowingRefusalsDown<T>(window: RateWindow, ip: string, check: () => Promise<T>): Promise<T> {
    if (isAllowedIp(ip, await this.repository.findAllowedIps())) return check();

    const refusals = { caller: `ip:${canonicalIp(ip) ?? ip}`, minute: window.start, route: 'refused' };
    window.assertWithin(REFUSALS_LIMIT_PER_MINUTE, (await this.repository.findCount(refusals)) + 1);

    try {
      return await check();
    } catch (error) {
      if (error instanceof ApiClientUnauthenticated || error instanceof ApiClientForbidden) {
        const count = await this.repository.countCall(refusals);
        // The IP is turned away from the next call on, and the 429s are not counted: the last refusal is reported
        if (window.isLastWithin(REFUSALS_LIMIT_PER_MINUTE, count)) {
          this.alerts.refusalsLimited({ ip, limit: REFUSALS_LIMIT_PER_MINUTE });
        }
      }
      throw error;
    }
  }

  @Transactional()
  async list(command: { actorId: string }): Promise<ListedApiClientsDto> {
    await this.assertManager(command.actorId);

    return this.listApiClients.handle({ now: this.clock.now() });
  }

  /** The secret is returned once and never stored: lost, it can only be replaced */
  @Transactional()
  async create(command: {
    actorId: string;
    allowedIps: readonly string[];
    name: string;
    scopes: readonly ApiScope[];
  }): Promise<{ id: string; secret: string }> {
    await this.assertManager(command.actorId);
    const id = makeId('ApiClientId');
    const { hash: secretHash, secret } = ApiClient.generateSecret();
    await this.repository.create({
      ...distinctConfiguration({
        allowedIps: command.allowedIps,
        authLimitPerMinute: DEFAULT_LIMITS_PER_MINUTE.auth,
        scopes: command.scopes.map((scope) => ({ limitPerMinute: DEFAULT_LIMITS_PER_MINUTE[scope], scope })),
      }),
      actorId: command.actorId,
      clientId: id,
      name: command.name,
      now: this.clock.now(),
      secretHash,
    });

    return { id, secret };
  }

  /** The new secret is returned once, like the first one */
  @Transactional()
  async rotateSecret(command: {
    actorId: string;
    clientId: string;
    days?: number;
  }): Promise<{ previousValidUntil: Date; secret: string }> {
    const client = await this.findManagedClient(command);
    const now = this.clock.now();

    const { secret, ...secrets } = client.rotateSecret({ days: command.days, now });
    const saved = await this.repository.saveRotatedSecret({
      actorId: command.actorId,
      clientId: client.id,
      now,
      ...secrets,
    });
    if (!saved) throw new ApiClientNotRotatable('rotating');

    return { previousValidUntil: secrets.previousSecret.expiresAt, secret };
  }

  /**
   * Once the partner confirms it has switched, or at once when the replaced secret is in doubt: the tokens already
   * given go with it, the partner asks for a new one with the secret it holds. Nothing happens once the rotation is
   * over, which a second click finds
   */
  @Transactional()
  async endSecretRotation(command: { actorId: string; clientId: string }): Promise<void> {
    const client = await this.findManagedClient(command);
    const now = this.clock.now();
    if (!client.canEndSecretRotation(now)) return;

    await this.repository.endSecretRotation({ actorId: command.actorId, clientId: client.id, now });
  }

  /** Read on each call (see ApiClient.authorize): the next call of the partner meets the new configuration */
  @Transactional()
  async update(command: {
    actorId: string;
    clientId: string;
    configuration: ApiClientConfiguration;
  }): Promise<void> {
    const client = await this.findManagedClient(command);

    const configuration = client.update(command.configuration);
    const saved = await this.repository.saveConfiguration({
      actorId: command.actorId,
      clientId: client.id,
      configuration,
      now: this.clock.now(),
    });
    if (!saved) throw new ApiClientNotUpdatable('revoked');
  }

  /** Its tokens stop working at once (see ApiClient.authorize). Nothing happens once revoked: it keeps its date */
  @Transactional()
  async revoke(command: { actorId: string; clientId: string }): Promise<void> {
    const client = await this.findManagedClient(command);
    if (!client.canRevoke()) return;

    await this.repository.revoke({ actorId: command.actorId, clientId: client.id, now: this.clock.now() });
  }

  @Transactional()
  async listChanges(command: { actorId: string; clientId: string }): Promise<ListedApiClientChangesDto> {
    const client = await this.findManagedClient(command);

    return this.listApiClientChanges.handle({ clientId: client.id });
  }

  private async findManagedClient(command: { actorId: string; clientId: string }): Promise<ApiClient> {
    await this.assertManager(command.actorId);
    const client = await this.repository.findById(command.clientId);
    if (!client) throw new NotFoundException();

    return client;
  }

  private async assertManager(actorId: string): Promise<void> {
    if (!(await this.repository.canBeManagedBy(actorId))) throw new CantManageApiClients();
  }

  /** Counts the call of the client, then refuses it over the limit, reporting the first one refused in the minute */
  private async limitCall(
    window: RateWindow,
    call: { clientId: string; limit: number; route: string },
  ): Promise<void> {
    const count = await this.repository.countCall({
      caller: `client:${call.clientId}`,
      minute: window.start,
      route: call.route,
    });
    if (window.isFirstOver(call.limit, count)) this.alerts.rateLimited(call);
    window.assertWithin(call.limit, count);
  }
}
