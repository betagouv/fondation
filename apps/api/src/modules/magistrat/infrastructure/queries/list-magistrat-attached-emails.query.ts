import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { writerOf, writerSchema } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';

@Injectable()
export class ListMagistratAttachedEmailsQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { magistratId: string }): Promise<ListedMagistratAttachedEmailsDto> {
    const rows = await this.db.tx.attachedMagistratEmail.findMany({
      orderBy: [{ attachedAt: 'desc' }, { id: 'asc' }],
      select: {
        attachedAt: true,
        author: { select: { firstName: true, id: true, lastName: true } },
        email: true,
        id: true,
      } satisfies Prisma.AttachedMagistratEmailSelect,
      where: { magistratId: query.magistratId },
    });

    return {
      items: rows.map((row) => ({
        attachedAt: row.attachedAt.toISOString(),
        attachedBy: writerOf(row.author),
        email: row.email,
        id: row.id,
      })),
    };
  }
}

export class ListedMagistratAttachedEmailsDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        attachedAt: z.iso.datetime(),
        attachedBy: writerSchema,
        email: z.string(),
        id: z.uuid(),
      }),
    ),
  }),
) {}
