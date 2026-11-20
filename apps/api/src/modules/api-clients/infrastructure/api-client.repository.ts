import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { Prisma } from '../../../generated/prisma/client';
import { Db } from '../../framework/database';
import { ApiClient, ApiScope, IssuedAccessToken } from '../domain/api-client';

const CLIENT_SELECT = {
  allowedIps: { select: { ip: true } },
  id: true,
  revokedAt: true,
  scopes: { select: { scope: true } },
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

  /** The expired tokens of the client go with each new one: no purge to schedule */
  @Transactional(Propagation.Mandatory)
  async saveToken(command: { clientId: string; now: Date; token: IssuedAccessToken }): Promise<void> {
    const { clientId, now, token } = command;
    await this.db.tx.apiAccessToken.deleteMany({ where: { clientId, expiresAt: { lte: now } } });
    await this.db.tx.apiAccessToken.create({
      data: { clientId, expiresAt: token.expiresAt, hash: token.hash },
    });
  }

  async create(client: {
    allowedIps: readonly string[];
    id: string;
    name: string;
    scopes: readonly ApiScope[];
    secretHash: string;
  }): Promise<void> {
    await this.db.tx.apiClient.create({
      data: {
        allowedIps: { create: client.allowedIps.map((ip) => ({ ip })) },
        id: client.id,
        name: client.name,
        scopes: { create: client.scopes.map((scope) => ({ scope })) },
        secretHash: client.secretHash,
      },
    });
  }

  private static toDomain(client: Prisma.ApiClientGetPayload<{ select: typeof CLIENT_SELECT }>): ApiClient {
    return new ApiClient({
      allowedIps: client.allowedIps.map(({ ip }) => ip),
      id: client.id,
      revokedAt: client.revokedAt,
      scopes: client.scopes.map(({ scope }) => scope),
      secretHash: client.secretHash,
    });
  }
}
