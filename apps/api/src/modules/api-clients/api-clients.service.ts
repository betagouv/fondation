import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { makeId } from '../../utils/id';
import { Clock } from '../framework/clock';

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
import { ApiClientRepository } from './infrastructure/api-client.repository';
import { ListApiClientsQuery, ListedApiClientsDto } from './infrastructure/queries/list-api-clients.query';

@Injectable()
export class ApiClientsService {
  constructor(
    private readonly clock: Clock,
    private readonly listApiClients: ListApiClientsQuery,
    private readonly repository: ApiClientRepository,
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

      const token = client.authenticate({ ip: command.ip, now: window.now, secret: command.clientSecret });
      await this.countCall(window, {
        caller: `client:${client.id}`,
        limit: client.authLimitPerMinute,
        route: 'auth',
      });
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

      const { limitPerMinute } = found.client.authorize({
        ip: command.ip,
        now: window.now,
        scope: command.scope,
        tokenExpiresAt: found.tokenExpiresAt,
      });
      await this.countCall(window, {
        caller: `client:${found.client.id}`,
        limit: limitPerMinute,
        route: command.scope,
      });
    });
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
        await this.repository.countCall(refusals);
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
      id,
      name: command.name,
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

    const { secret, ...secrets } = client.rotateSecret({ days: command.days, now: this.clock.now() });
    const saved = await this.repository.saveRotatedSecret({ clientId: client.id, ...secrets });
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
    if (!client.canEndSecretRotation(this.clock.now())) return;

    await this.repository.endSecretRotation(client.id);
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
    const saved = await this.repository.saveConfiguration({ clientId: client.id, configuration });
    if (!saved) throw new ApiClientNotUpdatable('revoked');
  }

  /** Its tokens stop working at once (see ApiClient.authorize). Nothing happens once revoked: it keeps its date */
  @Transactional()
  async revoke(command: { actorId: string; clientId: string }): Promise<void> {
    const client = await this.findManagedClient(command);
    if (!client.canRevoke()) return;

    await this.repository.revoke({ clientId: client.id, now: this.clock.now() });
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

  private async countCall(
    window: RateWindow,
    call: { caller: string; limit: number; route: string },
  ): Promise<void> {
    const count = await this.repository.countCall({
      caller: call.caller,
      minute: window.start,
      route: call.route,
    });
    window.assertWithin(call.limit, count);
  }
}
