import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class IsSessionReadyForDocGenerationQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { sessionId: string }): Promise<DocGenerationSessionReadinessDto> {
    const { canCreateAgenda, canCreateOfficialReport, isReady } = await this.prisma.$transaction(
      async (tx) => {
        const hasAnyAgendaWithoutOfficialReport = Boolean(
          await tx.agenda.findFirst({
            select: { id: true },
            where: { officialReportId: null, sessionId: query.sessionId },
          }),
        );

        const hasAnySuspendedFile = await tx.dossierDeNomination.findFirst({
          select: { id: true },
          where: {
            sessionId: query.sessionId,
            OR: [{ outcome: { in: ['SUSPENDED', 'WAITING_DSJ', 'ASSESSING'] } }, { outcome: null }],
          },
        });

        if (hasAnySuspendedFile) {
          return {
            isReady: true,
            canCreateAgenda: true,
            canCreateOfficialReport: Boolean(hasAnyAgendaWithoutOfficialReport),
          };
        }

        const hasAnyNonReportedFile = await tx.dossierDeNomination.findFirst({
          select: { id: true },
          where: {
            sessionId: query.sessionId,
            agendaInclusions: { none: { outcome: { in: ['VALIDATED', 'NON_VALIDATED', 'WITHDRAWN'] } } },
          },
        });

        const canCreateAgenda = Boolean(hasAnyNonReportedFile);
        const canCreateOfficialReport = Boolean(hasAnyAgendaWithoutOfficialReport);

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
