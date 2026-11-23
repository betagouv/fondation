import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { Prisma } from '../../../generated/prisma/client';
import { countApiCallRawQuery } from '../../../generated/prisma/sql';
import { User } from '../../administration/domain/user';
import { Db } from '../../framework/database';
import { ApiClient, ApiScope, IssuedAccessToken } from '../domain/api-client';

export const CLIENT_SELECT = {
  allowedIps: { select: { ip: true } },
  authLimitPerMinute: true,
  id: true,
  previousSecretExpiresAt: true,
  previousSecretHash: true,
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

  /** @returns the IPs allowed by the clients not revoked, as they were registered */
  async findAllowedIps(): Promise<string[]> {
    const allowed = await this.db.tx.apiClientAllowedIp.findMany({
      where: { client: { revokedAt: null } },
      select: { ip: true } satisfies Prisma.ApiClientAllowedIpSelect,
    });

    return allowed.map(({ ip }) => ip);
  }

  /**
   * Counted outside any transaction, so that a refused call still counts and simultaneous calls count each other
   *
   * @returns the calls of the caller on this route within the minute, this one included
   */
  @Transactional(Propagation.NotSupported)
  async countCall(call: { caller: string; minute: Date; route: string }): Promise<number> {
    const [counter] = await this.db.tx.$queryRawTyped(
      countApiCallRawQuery(call.caller, call.route, call.minute),
    );

    return counter!.count;
  }

  /** @returns the calls of the caller already counted on this route within the minute */
  async findCount(call: { caller: string; minute: Date; route: string }): Promise<number> {
    const counter = await this.db.tx.apiRateCounter.findUnique({
      where: { primaryKey: call },
      select: { count: true } satisfies Prisma.ApiRateCounterSelect,
    });

    return counter?.count ?? 0;
  }

  @Transactional()
  async saveToken(command: { clientId: string; token: IssuedAccessToken }): Promise<void> {
    const { clientId, token } = command;
    await this.db.tx.apiAccessToken.create({
      data: { clientId, expiresAt: token.expiresAt, hash: token.hash },
    });
    await this.db.tx.apiClient.update({
      where: { id: clientId },
      data: { lastTokenIssuedAt: token.issuedAt },
    });
  }

  /** @returns whether the user may manage the API clients, false when unknown */
  async canBeManagedBy(userId: string): Promise<boolean> {
    const user = await this.db.tx.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, isTechnical: true } satisfies Prisma.UserSelect,
    });

    return !!user && User.canManageApiClients(user);
  }

  /** Keeps the date of a revocation made at the same time: the first one wins */
  async revoke(command: { clientId: string; now: Date }): Promise<void> {
    await this.db.tx.apiClient.updateMany({
      where: { id: command.clientId, revokedAt: null },
      data: { revokedAt: command.now },
    });
  }

  /** @param countedSince the minute the calls are counted under: the ones before it no longer limit anybody */
  @Transactional()
  async purge(command: { countedSince: Date; now: Date }): Promise<void> {
    await this.db.tx.apiAccessToken.deleteMany({ where: { expiresAt: { lte: command.now } } });
    await this.db.tx.apiRateCounter.deleteMany({ where: { minute: { lt: command.countedSince } } });
  }

  async create(client: {
    allowedIps: readonly string[];
    authLimitPerMinute: number;
    id: string;
    name: string;
    scopes: readonly { limitPerMinute: number; scope: ApiScope }[];
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

  /** @returns whether the secret was replaced: not when another rotation replaced it in the meantime */
  async saveRotatedSecret(command: {
    clientId: string;
    previousSecret: { expiresAt: Date; hash: string };
    secretHash: string;
  }): Promise<boolean> {
    const { count } = await this.db.tx.apiClient.updateMany({
      where: { id: command.clientId, secretHash: command.previousSecret.hash },
      data: {
        previousSecretExpiresAt: command.previousSecret.expiresAt,
        previousSecretHash: command.previousSecret.hash,
        secretHash: command.secretHash,
      },
    });

    return count === 1;
  }

  /** The tokens do not tell which secret they were given for: all those of the client go with the replaced secret */
  @Transactional(Propagation.Mandatory)
  async endSecretRotation(clientId: string): Promise<void> {
    await this.db.tx.apiClient.update({
      where: { id: clientId },
      data: { previousSecretExpiresAt: null, previousSecretHash: null },
    });
    await this.db.tx.apiAccessToken.deleteMany({ where: { clientId } });
  }

  static toDomain(client: Prisma.ApiClientGetPayload<{ select: typeof CLIENT_SELECT }>): ApiClient {
    return new ApiClient({
      allowedIps: client.allowedIps.map(({ ip }) => ip),
      authLimitPerMinute: client.authLimitPerMinute,
      id: client.id,
      previousSecret:
        client.previousSecretHash && client.previousSecretExpiresAt
          ? { expiresAt: client.previousSecretExpiresAt, hash: client.previousSecretHash }
          : null,
      revokedAt: client.revokedAt,
      scopes: client.scopes,
      secretHash: client.secretHash,
    });
  }
}
