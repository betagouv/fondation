import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { Magistrat } from 'shared-models';
import { PrismaService } from 'src/modules/framework/database';
import { isGrade } from 'src/modules/shared/mappers/grade.mapper';
import z from 'zod';
import { NominationFileOutcome } from '../../domain/nomination-file-outcome';

@Injectable()
export class InternalFindAgendaNominationFilesQuery {
  private readonly logger = new Logger(
    InternalFindAgendaNominationFilesQuery.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    sessionId: string;
    ids?: readonly string[];
  }): Promise<InternalFoundAgendaNominationFiles> {
    if ('ids' in query && (query.ids ?? []).length > 32_000) {
      this.logger.error(
        `Received ${(query.ids ?? []).length} ids to search. Limited to 32000`,
      );
      throw new BadRequestException();
    }

    const nominationFiles = await this.prisma.dossierDeNomination.findMany({
      orderBy: [{ number: 'asc' }],
      where: {
        outcome: { not: null },
        sessionId: 'sessionId' in query ? query.sessionId : undefined,
        id: 'ids' in query ? { in: query.ids as string[] } : undefined,
      },
      select: {
        currentPosition: true,
        detectedMagistratId: true,
        grade: true,
        id: true,
        name: true,
        number: true,
        outcome: true,
        outcomeComment: true,
        targetedGrade: true,
        targetedPosition: true,
      },
    });

    const items: InternalFoundAgendaNominationFiles['items'] = [];
    for (const item of nominationFiles) {
      const {
        currentPosition,
        grade,
        id,
        name,
        number,
        outcome,
        outcomeComment,
        targetedGrade,
        targetedPosition,
        detectedMagistratId: magistratId,
      } = item;

      if (!isGrade(grade) || !isGrade(targetedGrade)) continue;
      if (!outcome || !currentPosition || !targetedPosition) continue;
      if (typeof number !== 'number' || !Number.isFinite(number)) {
        continue;
      }

      const nominationFileOutcome = NominationFileOutcome.from({
        outcome,
        comment: outcomeComment,
      });

      items.push({
        currentPosition,
        grade,
        id,
        magistratId,
        name,
        number,
        targetedGrade,
        targetedPosition,
        outcome: {
          value: nominationFileOutcome.outcome,
          comment: nominationFileOutcome.comment,
        },
      });
    }

    return { items };
  }
}

export class InternalFoundAgendaNominationFiles extends createZodDto(
  z.object({
    items: z.array(
      z.looseObject({
        currentPosition: z.string(),
        grade: z.enum(Magistrat.Grade),
        id: z.string(),
        magistratId: z.string().nullable(),
        name: z.string(),
        number: z.number(),
        targetedGrade: z.enum(Magistrat.Grade),
        targetedPosition: z.string(),
        outcome: z.object({
          value: z.enum(NominationFileOutcome.enum),
          comment: z.string().nullable(),
        }),
      }),
    ),
  }),
) {}
