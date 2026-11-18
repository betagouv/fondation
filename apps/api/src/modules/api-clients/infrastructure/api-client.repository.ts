import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { Prisma } from '../../../generated/prisma/client';
import { countApiCallRawQuery } from '../../../generated/prisma/sql';
import { Db } from '../../framework/database';
import { ApiClient, IssuedAccessToken } from '../domain/api-client';

const CLIENT_SELECT = {
  allowedIps: { select: { ip: true } },
  authLimitPerMinute: true,
  id: true,
  revokedAt: true,
  scopes: { select: { limitPerMinute: true, scope: true } },
  secretHash: true,
} satisfies Prisma.ApiClientSelect;

@Injectable()
export class ApiClientRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<ApiClient | null> {
    // The identifier comes from the partner: Prisma throws on anything but a UUID
    if (!z.uuid().safeParse(id).success) return null;

    const client = await this.db.tx.apiClient.findUnique({
      where: { id },
      select: CLIENT_SELECT satisfies Prisma.ApiClientSelect,
    });

    return client && ApiClientRepository.toDomain(client);
  }

  async findByToken(token: string): Promise<{ client: ApiClient; tokenExpiresAt: Date } | null> {
    const found = await this.db.tx.apiAccessToken.findUnique({
      where: { hash: ApiClient.hash(token) },
      select: { client: { select: CLIENT_SELECT }, expiresAt: true } satisfies Prisma.ApiAccessTokenSelect,
    });

    return found && { client: ApiClientRepository.toDomain(found.client), tokenExpiresAt: found.expiresAt };
  }

  /**
   * Counted outside any transaction, so that a refused call still counts and simultaneous calls count each other
   *
   * @returns the calls of the caller on this route within the minute, this one included
   */
  async countCall(call: { caller: string; minute: Date; route: string }): Promise<number> {
    const [counter] = await this.db.tx.$queryRawTyped(
      countApiCallRawQuery(call.caller, call.route, call.minute),
    );

    return counter!.count;
  }

  /** What is over goes with each new token, the expired tokens of the client and the past counts of everyone: no purge to schedule */
  @Transactional()
  async saveToken(command: {
    clientId: string;
    countedSince: Date;
    now: Date;
    token: IssuedAccessToken;
  }): Promise<void> {
    const { clientId, countedSince, now, token } = command;
    await this.db.tx.apiAccessToken.deleteMany({ where: { clientId, expiresAt: { lte: now } } });
    await this.db.tx.apiRateCounter.deleteMany({ where: { minute: { lt: countedSince } } });
    await this.db.tx.apiAccessToken.create({
      data: { clientId, expiresAt: token.expiresAt, hash: token.hash },
    });
  }

  async create(client: {
    allowedIps: readonly string[];
    authLimitPerMinute: number;
    id: string;
    name: string;
    scopes: readonly { limitPerMinute: number; scope: string }[];
    secretHash: string;
  }): Promise<void> {
    await this.db.tx.apiClient.create({
      data: {
        allowedIps: { create: client.allowedIps.map((ip) => ({ ip })) },
        authLimitPerMinute: client.authLimitPerMinute,
        id: client.id,
        name: client.name,
        scopes: { create: client.scopes.map(({ limitPerMinute, scope }) => ({ limitPerMinute, scope })) },
        secretHash: client.secretHash,
      },
    });
  }

  private static toDomain(client: Prisma.ApiClientGetPayload<{ select: typeof CLIENT_SELECT }>): ApiClient {
    return new ApiClient({
      allowedIps: client.allowedIps.map(({ ip }) => ip),
      authLimitPerMinute: client.authLimitPerMinute,
      id: client.id,
      revokedAt: client.revokedAt,
      scopes: client.scopes,
      secretHash: client.secretHash,
    });
  }
}
