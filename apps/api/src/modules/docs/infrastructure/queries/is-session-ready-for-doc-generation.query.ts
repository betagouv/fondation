import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { PrismaService } from 'src/modules/framework/database';
import z from 'zod';

@Injectable()
export class IsSessionReadyForDocGenerationQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    sessionId: string;
  }): Promise<DocGenerationSessionReadinessDto> {
    const isReady = await this.prisma.$transaction(async (tx) => {
      const hasAnySuspendedFile = await tx.dossierDeNomination.findFirst({
        select: { id: true },
        where: {
          sessionId: query.sessionId,
          outcome: { in: ['SUSPENDED', 'WAITING_DSJ', 'ASSESSING'] },
        },
      });

      if (!!hasAnySuspendedFile) return true;

      const hasAnyNonReportedWithOutcomeFile =
        await tx.dossierDeNomination.findFirst({
          select: { id: true },
          where: {
            agendaInclusions: { none: {} },
            sessionId: query.sessionId,
            outcome: {
              not: null,
              notIn: ['ASSESSING', 'SUSPENDED', 'WAITING_DSJ'],
            },
          },
        });

      return !!hasAnyNonReportedWithOutcomeFile;
    });

    return { isReady };
  }
}

export class DocGenerationSessionReadinessDto extends createZodDto(
  z.object({ isReady: z.boolean() }),
) {}
