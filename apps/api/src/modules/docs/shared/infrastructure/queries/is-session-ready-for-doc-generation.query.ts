import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { AffectationVersionFinder } from 'src/modules/session/infrastructure/finders/affectation-version.finder';

@Injectable()
export class IsSessionReadyForDocGenerationQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versions: AffectationVersionFinder,
  ) {}

  async handle(query: { sessionId: string }): Promise<DocGenerationSessionReadinessDto> {
    const { canCreateAgenda, canCreateOfficialReport, isReady } = await this.prisma.$transaction(
      async (tx) => {
        const session = await tx.session.findFirst({
          where: { id: query.sessionId },
          select: { deletedAt: true, archivedAt: true },
        });

        if (!session) throw new NotFoundException();
        if (session.archivedAt || session.deletedAt) {
          return {
            isReady: false,
            canCreateAgenda: false,
            canCreateOfficialReport: false,
          };
        }

        const publishedVersion = await this.versions.lastPublished({ sessionId: query.sessionId, tx });
        if (publishedVersion.isNone()) {
          return {
            isReady: false,
            canCreateAgenda: false,
            canCreateOfficialReport: false,
          };
        }

        const hasAnyNonReportedAgenda = await tx.agenda.findFirst({
          where: { sessionId: query.sessionId, officialReportId: null },
        });

        const hasAnyNonOfficiallyReportedFile = await tx.dossierDeNomination.findFirst({
          select: { id: true },
          where: {
            sessionId: query.sessionId,
            officialReportInclusions: {
              none: { outcome: { in: ['VALIDATED', 'NON_VALIDATED', 'WITHDRAWN'] } },
            },
          },
        });

        const canCreateAgenda = Boolean(hasAnyNonOfficiallyReportedFile);
        const canCreateOfficialReport = Boolean(hasAnyNonReportedAgenda && hasAnyNonOfficiallyReportedFile);

        return {
          canCreateAgenda,
          canCreateOfficialReport,
          isReady: canCreateAgenda || canCreateOfficialReport,
        };
      },
    );

    return { isReady, canCreateAgenda, canCreateOfficialReport };
  }
}

export class DocGenerationSessionReadinessDto extends createZodDto(
  z.object({
    isReady: z.boolean(),
    canCreateAgenda: z.boolean(),
    canCreateOfficialReport: z.boolean(),
  }),
) {}
