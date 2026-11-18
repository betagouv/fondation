import { Injectable } from '@nestjs/common';

import { makeId } from '../../utils/id';
import { Clock } from '../framework/clock';

import {
  ApiClient,
  ApiClientForbidden,
  ApiClientUnauthenticated,
  ApiScope,
  DEFAULT_LIMITS_PER_MINUTE,
} from './domain/api-client';
import { RateWindow } from './domain/rate-window';
import { ApiClientRepository } from './infrastructure/api-client.repository';

@Injectable()
export class ApiClientsService {
  constructor(
    private readonly clock: Clock,
    private readonly repository: ApiClientRepository,
  ) {}

  /**
   * A refused authentication counts for its IP and an accepted one for the client: whoever knows the identifier alone
   * cannot use up the tokens of the client, and whoever tries secrets is slowed down wherever the identifier comes from
   */
  async authenticate(command: {
    clientId: string;
    clientSecret: string;
    ip: string;
  }): Promise<{ accessToken: string; expiresIn: number }> {
    const window = new RateWindow(this.clock.now());

    try {
      const client = await this.repository.findById(command.clientId);
      if (!client) throw new ApiClientUnauthenticated();

      const token = client.authenticate({ ip: command.ip, now: window.now, secret: command.clientSecret });
      await this.countCall(window, {
        caller: `client:${client.id}`,
        limit: client.authLimitPerMinute,
        route: 'auth',
      });
      await this.repository.saveToken({
        clientId: client.id,
        countedSince: window.start,
        now: window.now,
        token,
      });

      return { accessToken: token.token, expiresIn: token.expiresIn };
    } catch (error) {
      if (error instanceof ApiClientUnauthenticated || error instanceof ApiClientForbidden) {
        await this.countCall(window, {
          caller: `ip:${command.ip}`,
          limit: DEFAULT_LIMITS_PER_MINUTE.auth,
          route: 'auth',
        });
      }
      throw error;
    }
  }

  async authorize(command: { ip: string; scope: ApiScope; token: string | undefined }): Promise<void> {
    const found = command.token ? await this.repository.findByToken(command.token) : null;
    if (!found) throw new ApiClientUnauthenticated();

    const window = new RateWindow(this.clock.now());
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
