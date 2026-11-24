import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';
import {
  API_SCOPES,
  ApiClientStatus,
  ApiScope,
  DEFAULT_LIMITS_PER_MINUTE,
  LIMIT_PER_MINUTE,
  ROTATION_DAYS,
} from '../../domain/api-client';
import { CLIENT_SELECT, ApiClientRepository } from '../api-client.repository';

const SCOPE_LABELS = {
  'magistrats:identification': 'Identifier un magistrat par son adresse professionnelle',
  'magistrats:status': "Relire le statut d'un magistrat",
} as const satisfies Record<ApiScope, string>;

/** A scope stored before its route was removed keeps its name for a label */
function labeledScope(scope: string): { id: string; label: string } {
  return { id: scope, label: SCOPE_LABELS[scope as ApiScope] ?? scope };
}

function servedStatus(status: ApiClientStatus): ListedApiClientsDto['items'][number]['status'] {
  switch (status.value) {
    case 'ACTIVE':
      return status;
    case 'REVOKED':
      return { since: status.since.toISOString(), value: status.value };
    case 'ROTATING':
      return { until: status.until.toISOString(), value: status.value };
  }
}

/** A handful of clients: the list comes in one go */
@Injectable()
export class ListApiClientsQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { now: Date }): Promise<ListedApiClientsDto> {
    const clients = await this.db.tx.apiClient.findMany({
      orderBy: { createdAt: 'asc' },
      select: { ...CLIENT_SELECT, lastTokenIssuedAt: true, name: true } satisfies Prisma.ApiClientSelect,
    });

    return {
      items: clients.map(({ lastTokenIssuedAt, name, ...stored }) => {
        const client = ApiClientRepository.toDomain(stored);

        return {
          id: client.id,
          name,
          allowedIps: stored.allowedIps,
          authLimitPerMinute: client.authLimitPerMinute,
          scopes: stored.scopes.map(({ limitPerMinute, scope }) => ({
            limitPerMinute,
            scope: labeledScope(scope),
          })),
          status: servedStatus(client.status(query.now)),
          lastTokenIssuedAt: lastTokenIssuedAt?.toISOString() ?? null,
          canEndSecretRotation: client.canEndSecretRotation(query.now),
          canRevoke: client.canRevoke(),
          canRotateSecret: client.canRotateSecret(query.now),
          canUpdate: client.canUpdate(),
        };
      }),
      scopes: API_SCOPES.map((id) => ({
        id,
        label: SCOPE_LABELS[id],
        defaultLimitPerMinute: DEFAULT_LIMITS_PER_MINUTE[id],
      })),
      limitPerMinute: LIMIT_PER_MINUTE,
      secretRotationDays: ROTATION_DAYS,
    };
  }
}

const LabeledScopeSchema = z.object({ id: z.string(), label: z.string() });

export class ListedApiClientsDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        allowedIps: z.array(z.object({ ip: z.string() })),
        authLimitPerMinute: z.number().int(),
        scopes: z.array(z.object({ limitPerMinute: z.number(), scope: LabeledScopeSchema })),
        status: z.discriminatedUnion('value', [
          z.object({ value: z.literal('ACTIVE') }),
          z.object({
            until: z.iso.datetime().meta({ description: 'The replaced secret is refused from then' }),
            value: z.literal('ROTATING'),
          }),
          z.object({ since: z.iso.datetime(), value: z.literal('REVOKED') }),
        ]),
        lastTokenIssuedAt: z.iso.datetime().nullable(),
        canEndSecretRotation: z.boolean(),
        canRevoke: z.boolean(),
        canRotateSecret: z.boolean(),
        canUpdate: z.boolean(),
      }),
    ),
    scopes: z
      .array(
        z.object({
          id: z.enum(API_SCOPES),
          label: z.string(),
          defaultLimitPerMinute: z
            .number()
            .int()
            .meta({ description: 'The limit a client gets when the route is opened to it' }),
        }),
      )
      .meta({ description: 'The routes a client may be given' }),
    limitPerMinute: z
      .object({ min: z.number().int(), max: z.number().int() })
      .meta({ description: 'The bounds of a limit, for the authentication as for a route' }),
    secretRotationDays: z
      .object({ default: z.number().int(), max: z.number().int() })
      .meta({ description: 'How many days the replaced secret may stay valid after a rotation' }),
  }),
) {}
