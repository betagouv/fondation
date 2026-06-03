import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { NominationFileOutcome } from '../../domain/nomination-file-outcome';
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
      const version = await this.versionFinder.last({ tx, sessionId: query.sessionId });
      return [
        await tx.dossierDeNomination.count({
          where: {
            outcome: null,
            sessionId: query.sessionId,
            reporterIds: {
              none: version.map({
                /** @warning the '{}' checks that no reporter exist regardless of the version*/
                none: () => ({}),

                some: ({ id: versionId }) => ({ versionId }),
              }),
            },
          },
        }),

        await version.map({
          none: async () => 0,
          some: ({ id: versionId }) =>
            tx.dossierDeNomination.count({
              where: {
                sessionId: query.sessionId,
                OR: [
                  { outcome: { in: NominationFileOutcome.nonFinalOutcomes() } },
                  { outcome: null, reporterIds: { some: { versionId } } },
                ],
              },
            }),
        }),

        await version.map({
          none: async () => 0,
          some: () =>
            tx.dossierDeNomination.count({
              where: {
                sessionId: query.sessionId,
                outcome: { in: NominationFileOutcome.finalOutcomes() },
              },
            }),
        }),
      ] as const;
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
