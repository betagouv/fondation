import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { makeId } from '../../utils/id';
import { Clock } from '../framework/clock';

import { ApiClient, ApiClientUnauthenticated, ApiScope } from './domain/api-client';
import { ApiClientRepository } from './infrastructure/api-client.repository';

@Injectable()
export class ApiClientsService {
  constructor(
    private readonly clock: Clock,
    private readonly repository: ApiClientRepository,
  ) {}

  @Transactional()
  async authenticate(command: {
    clientId: string;
    clientSecret: string;
    ip: string;
  }): Promise<{ accessToken: string; expiresIn: number }> {
    const client = await this.repository.findById(command.clientId);
    if (!client) throw new ApiClientUnauthenticated();

    const now = this.clock.now();
    const token = client.authenticate({ ip: command.ip, now, secret: command.clientSecret });
    await this.repository.saveToken({ clientId: client.id, now, token });

    return { accessToken: token.token, expiresIn: token.expiresIn };
  }

  async authorize(command: { ip: string; scope: ApiScope; token: string | undefined }): Promise<void> {
    const found = command.token ? await this.repository.findByToken(command.token) : null;
    if (!found) throw new ApiClientUnauthenticated();

    found.client.authorize({
      ip: command.ip,
      now: this.clock.now(),
      scope: command.scope,
      tokenExpiresAt: found.tokenExpiresAt,
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
      id,
      name: command.name,
      scopes: [...new Set(command.scopes)],
      secretHash,
    });

    return { id, secret };
  }
}
