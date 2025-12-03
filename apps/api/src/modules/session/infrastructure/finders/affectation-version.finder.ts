import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { prismaStatutAffectationEnumToStatutAffectationEnum } from 'src/modules/shared/mappers/statut-affectation.mapper';
import { StatutAffectation } from 'src/modules/session/domain/statut-affectation.enum';

@Injectable()
export class AffectationVersionFinder {
  async last(query: {
    sessionId: string;
    tx: Prisma.TransactionClient;
  }): Promise<FoundAffectationVersion | null> {
    const { _max } = await query.tx.affectationVersion.aggregate({
      where: { sessionId: query.sessionId },
      _max: { version: true },
    });

    return this.version({
      tx: query.tx,
      version: _max.version,
      sessionId: query.sessionId,
    });
  }

  async lastPublished(query: {
    sessionId: string;
    tx: Prisma.TransactionClient;
  }) {
    const { _max } = await query.tx.affectationVersion.aggregate({
      where: { sessionId: query.sessionId, statut: 'PUBLIEE' },
      _max: { version: true },
    });

    return this.version({
      tx: query.tx,
      version: _max.version,
      sessionId: query.sessionId,
    });
  }

  private async version(props: {
    tx: Prisma.TransactionClient;
    sessionId: string;
    version: number | null;
  }): Promise<FoundAffectationVersion | null> {
    const version = await props.tx.affectationVersion.findFirst({
      select: {
        id: true,
        version: true,
        statut: true,
        datePublication: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      where: props.version
        ? { version: props.version, sessionId: props.sessionId }
        : { sessionId: props.sessionId },
    });

    if (!version) return null;

    return {
      id: version.id,
      version: version.version,
      author: version.user ?? null,
      publicationDate: version.datePublication?.toISOString() ?? null,
      status: prismaStatutAffectationEnumToStatutAffectationEnum(
        version.statut,
      ),
    };
  }
}

export class FoundAffectationVersion extends createZodDto(
  z.object({
    id: z.uuid(),
    status: z.enum(StatutAffectation),
    version: z.number().int().gte(1),
    publicationDate: z.iso.datetime().nullable(),
    author: z
      .object({ id: z.string(), firstName: z.string(), lastName: z.string() })
      .nullable(),
  }),
) {}
