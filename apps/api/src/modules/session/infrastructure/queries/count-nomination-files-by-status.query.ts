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
    const [unaffected, inProgress, withOutcome] =
      await this.prisma.$transaction(async (tx) => {
        const version = await this.versionFinder
          .last({ tx, sessionId: query.sessionId })
          .then((v) => v.getNullable());

        return [
          await tx.dossierDeNomination.count({
            where: {
              outcome: null,
              sessionId: query.sessionId,
              reporterIds: { none: { versionId: version?.id } },
            },
          }),

          await tx.dossierDeNomination.count({
            where: {
              outcome: null,
              sessionId: query.sessionId,
              reporterIds: version
                ? { some: { versionId: version.id } }
                : undefined,
            },
          }),

          await tx.dossierDeNomination.count({
            where: {
              sessionId: query.sessionId,
              outcome: { not: null },
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
