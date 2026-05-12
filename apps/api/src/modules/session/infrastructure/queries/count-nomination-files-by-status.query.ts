import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class CountNominationFilesByStatusQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: { sessionId: string }): Promise<NominationFilesStatusCountDto> {
    const [unaffected, inProgress, withOutcome] = await this.prisma.$transaction(async (tx) => {
      const version = await this.versionFinder
        .last({ tx, sessionId: query.sessionId })
        .then((v) => v.getNullable());

      return [
        await tx.dossierDeNomination.count({
          where: {
            outcome: null,
            sessionId: query.sessionId,
            reporterIds: { none: version ? { versionId: version.id } : {} },
          },
        }),

        await tx.dossierDeNomination.count({
          where: {
            sessionId: query.sessionId,
            OR: [
              { outcome: { in: ['ASSESSING', 'WAITING_DSJ', 'SUSPENDED'] } },
              version ? { reporterIds: { some: { versionId: version.id } } } : {},
            ],
          },
        }),

        await tx.dossierDeNomination.count({
          where: {
            sessionId: query.sessionId,
            outcome: { in: ['NON_VALIDATED', 'REMOVED', 'VALIDATED', 'WITHDRAWN'] },
          },
        }),
      ];
    });

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
