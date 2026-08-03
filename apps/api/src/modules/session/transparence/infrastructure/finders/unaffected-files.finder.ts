import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';

import { AffectationVersionFinder } from './affectation-version.finder';

@Injectable()
export class UnaffectedFilesFinder {
  constructor(
    private readonly db: Db,
    private readonly versions: AffectationVersionFinder,
  ) {}

  @Transactional()
  async find(predicate: {
    sessionId: string;
    nominationFileIds: readonly string[] | undefined;
  }): Promise<FoundUnaffectedFilesDto> {
    const version = await this.versions.last({
      sessionId: predicate.sessionId,
    });

    const items = await this.db.tx.dossierDeNomination.findMany({
      select: {
        id: true,
        targetedGrade: true,
        number: true,
      },
      where: {
        outcome: null,
        sessionId: predicate.sessionId,
        id: { in: predicate.nominationFileIds as string[] | undefined },
        reporterIds: {
          none: { versionId: version.optionalId },
        },
      },
    });

    return { items };
  }
}

export class FoundUnaffectedFilesDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        number: z.number().nullable(),
        targetedGrade: z.string().nullable(),
      }),
    ),
  }),
) {}
