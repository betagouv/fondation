import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';

@Injectable()
export class CountNominationFilesByStatusQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: {
    sessionId: string;
  }): Promise<NominationFilesStatusCountDto> {
    const lastVersion = await this.versionFinder.last({
      tx: this.prisma,
      sessionId: query.sessionId,
    });

    const [unaffected, inProgress, withOutcome] =
      await this.prisma.$transaction([
        this.prisma.dossierDeNomination.count({
          where: {
            sessionId: query.sessionId,
            outcome: null,
            reporterIds: lastVersion
              ? { none: { versionId: lastVersion.id } }
              : { none: {} },
          },
        }),
        this.prisma.dossierDeNomination.count({
          where: {
            sessionId: query.sessionId,
            outcome: null,
            reporterIds: lastVersion
              ? { some: { versionId: lastVersion.id } }
              : undefined,
          },
        }),
        this.prisma.dossierDeNomination.count({
          where: {
            sessionId: query.sessionId,
            outcome: { not: null },
          },
        }),
      ]);

    return { unaffected, inProgress, withOutcome };
  }
}

export class NominationFilesStatusCountDto extends createZodDto(
  z.object({
    unaffected: z.number(),
    inProgress: z.number(),
    withOutcome: z.number(),
  }),
) {}
