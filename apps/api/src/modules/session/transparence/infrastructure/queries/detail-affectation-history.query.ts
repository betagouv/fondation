import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { fullname } from 'src/utils/user.util';

const PERSON_SELECT = { firstName: true, id: true, lastName: true } satisfies Prisma.UserSelect;

type Person = { firstName: string; id: string; lastName: string } | null;

const writerSchema = z.object({ id: z.string(), name: z.string() }).nullable();

function writerOf(person: Person) {
  return person ? { id: person.id, name: fullname(person) } : null;
}

/** the version the members read, and the one the secretariat works on until it publishes it */
@Injectable()
export class DetailAffectationHistoryQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: { sessionId: string }): Promise<DetailedAffectationHistoryDto> {
    const published = await this.db.tx.affectationVersion.findFirst({
      where: { sessionId: query.sessionId, statut: 'PUBLIEE' },
      orderBy: { version: 'desc' },
      select: {
        datePublication: true,
        user: { select: PERSON_SELECT },
        version: true,
      } satisfies Prisma.AffectationVersionSelect,
    });

    const pending = await this.db.tx.affectationVersion.findFirst({
      where: { sessionId: query.sessionId, statut: 'BROUILLON' },
      orderBy: { version: 'desc' },
      select: {
        author: { select: PERSON_SELECT },
        createdAt: true,
        version: true,
      } satisfies Prisma.AffectationVersionSelect,
    });

    return {
      lastPublished: published?.datePublication
        ? {
            at: published.datePublication.toISOString(),
            by: writerOf(published.user),
            version: published.version,
          }
        : null,
      pending: pending
        ? {
            openedAt: pending.createdAt.toISOString(),
            openedBy: writerOf(pending.author),
            version: pending.version,
          }
        : null,
    };
  }
}

export class DetailedAffectationHistoryDto extends createZodDto(
  z.object({
    lastPublished: z.object({ at: z.iso.datetime(), by: writerSchema, version: z.number().int() }).nullable(),
    pending: z
      .object({ openedAt: z.iso.datetime(), openedBy: writerSchema, version: z.number().int() })
      .nullable(),
  }),
) {}
