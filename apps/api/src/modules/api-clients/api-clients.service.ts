import { Injectable } from '@nestjs/common';

import { makeId } from '../../utils/id';
import { Clock } from '../framework/clock';

import {
  ApiClient,
  ApiClientForbidden,
  ApiClientUnauthenticated,
  ApiScope,
  canonicalIp,
  DEFAULT_LIMITS_PER_MINUTE,
  isAllowedIp,
  REFUSALS_LIMIT_PER_MINUTE,
} from './domain/api-client';
import { RateWindow } from './domain/rate-window';
import { ApiClientRepository } from './infrastructure/api-client.repository';

@Injectable()
export class ApiClientsService {
  constructor(
    private readonly clock: Clock,
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
      await this.repository.saveToken({ clientId: client.id, token });

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

  /** The secret is returned once and never stored: lost, it can only be replaced */
  async register(command: {
    allowedIps: readonly string[];
    name: string;
    scopes: readonly ApiScope[];
  }): Promise<{ id: string; secret: string }> {
    const id = makeId('ApiClientId');
    const { hash: secretHash, secret } = ApiClient.generateSecret();
    await this.repository.create({
      // an IP or a scope given twice would break the primary key
      allowedIps: [...new Set(command.allowedIps)],
      authLimitPerMinute: DEFAULT_LIMITS_PER_MINUTE.auth,
      id,
      name: command.name,
      scopes: [...new Set(command.scopes)].map((scope) => ({
        limitPerMinute: DEFAULT_LIMITS_PER_MINUTE[scope],
        scope,
      })),
      secretHash,
    });

    return { id, secret };
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
