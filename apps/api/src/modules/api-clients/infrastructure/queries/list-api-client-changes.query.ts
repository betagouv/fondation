import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { fullname, writerSchema } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';
import { API_CLIENT_CHANGES, ApiClientChange } from '../../domain/api-client';

const CHANGE_LABELS = {
  CREATED: 'Création',
  REVOKED: 'Révocation',
  SECRET_ROTATION_ENDED: 'Rotation du secret close',
  SECRET_ROTATION_STARTED: 'Rotation du secret lancée',
  UPDATED: 'Modification des IP, des routes ou des limites',
} as const satisfies Record<ApiClientChange, string>;

/** A handful of lines a year for a client: the history comes in one go */
@Injectable()
export class ListApiClientChangesQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { clientId: string }): Promise<ListedApiClientChangesDto> {
    const changes = await this.db.tx.apiClientChange.findMany({
      where: { clientId: query.clientId },
      orderBy: { changedAt: 'desc' },
      select: {
        author: { select: { firstName: true, id: true, lastName: true } },
        change: true,
        changedAt: true,
        previousSecretValidUntil: true,
      } satisfies Prisma.ApiClientChangeSelect,
    });

    return {
      items: changes.map(({ author, change, changedAt, previousSecretValidUntil }) => ({
        change: { id: change, label: CHANGE_LABELS[change] },
        changedAt: changedAt.toISOString(),
        changedBy: { id: author.id, name: fullname(author) },
        previousSecretValidUntil: previousSecretValidUntil?.toISOString() ?? null,
      })),
    };
  }
}

export class ListedApiClientChangesDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        change: z.object({ id: z.enum(API_CLIENT_CHANGES), label: z.string() }),
        changedAt: z.iso.datetime(),
        changedBy: writerSchema.unwrap(),
        previousSecretValidUntil: z.iso.datetime().nullable().meta({
          description:
            'Only when a rotation starts: when the replaced secret stops working if nobody ends the rotation',
        }),
      }),
    ),
  }),
) {}
