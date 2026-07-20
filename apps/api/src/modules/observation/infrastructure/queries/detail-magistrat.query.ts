import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { findMagistratsCurrentPositionRawQuery, findReportedSessionIds } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import {
  NominationFileOutcome,
  nominationFileOutcomeLabel,
} from 'src/modules/session/domain/nomination-file-outcome';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { buildMagistratLolfiUrl } from 'src/utils/build-magistrat-lolfi-url';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';

@Injectable()
export class DetailMagistratQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { magistratId: string }): Promise<DetailedMagistratDto> {
    return this.prisma.$transaction(async (tx) => {
      const magistrat = await tx.magistrat.findUnique({
        where: { id: query.magistratId },
        select: {
          id: true,
          civilite: true,
          firstName: true,
          lastName: true,
          usedName: true,
          grade: true,
          careerHistory: true,
          externalId: true,

          detectedInNominationFiles: {
            where: { session: { deletedAt: null } },
            orderBy: { session: { date: 'desc' } },
            select: {
              id: true,
              targetedPosition: true,
              outcome: true,
              outcomeComment: true,
              session: {
                select: {
                  id: true,
                  name: true,
                  formation: true,
                  date: true,
                  archivedAt: true,
                },
              },
            },
          },

          observations: {
            where: { nominationFile: { session: { deletedAt: null } } },
            orderBy: { dateReception: 'desc' },
            select: {
              id: true,
              dateReception: true,
              nominationFile: {
                select: {
                  id: true,
                  name: true,
                  targetedPosition: true,
                  session: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });

      if (!magistrat) throw new NotFoundException();

      const sessionIds = Array.from(
        new Set(magistrat.detectedInNominationFiles.map(({ session }) => session.id)),
      );
      const positions = await tx.$queryRawTyped(findMagistratsCurrentPositionRawQuery([magistrat.id]));
      const reportedRows = sessionIds.length
        ? await tx.$queryRawTyped(findReportedSessionIds(sessionIds))
        : [];
      const reportedIds = new Set(reportedRows.map(({ id }) => id));

      return {
        id: magistrat.id,
        civilite: magistrat.civilite,
        firstName: magistrat.firstName,
        lastName: magistrat.lastName,
        usedName: magistrat.usedName,
        grade: magistrat.grade,
        currentPosition: positions[0]?.currentPosition || null,
        careerHistory: magistrat.careerHistory,
        externalUrl: buildMagistratLolfiUrl(magistrat.externalId),

        propositions: magistrat.detectedInNominationFiles.map((dossier) => {
          const formation = prismaFormationEnumToFormationEnum(dossier.session.formation);

          return {
            nominationFileId: dossier.id,
            sessionId: dossier.session.id,
            sessionName: dossier.session.name,
            formation,
            dateTransparence: DateOnly.fromDate(dossier.session.date).toJson(),
            targetedPosition: dossier.targetedPosition,
            outcome: dossier.outcome
              ? {
                  value: dossier.outcome,
                  label: nominationFileOutcomeLabel({ outcome: dossier.outcome, formation }),
                  comment: dossier.outcomeComment,
                }
              : null,
            isArchived: !!dossier.session.archivedAt,
            isSessionReported: reportedIds.has(dossier.session.id),
          };
        }),

        observations: magistrat.observations.map((observation) => ({
          id: observation.id,
          dateReception: DateOnly.fromDate(observation.dateReception).toJson(),
          sessionId: observation.nominationFile.session.id,
          sessionName: observation.nominationFile.session.name,
          nominationFileId: observation.nominationFile.id,
          magistratName: observation.nominationFile.name,
          targetedPosition: observation.nominationFile.targetedPosition,
        })),
      };
    });
  }
}

const MagistratPropositionSchema = z.object({
  nominationFileId: z.string(),
  sessionId: z.string(),
  sessionName: z.string(),
  formation: z.enum(FormationEnum),
  dateTransparence: dateOnlyJsonSchema,
  targetedPosition: z.string().nullable(),
  outcome: z
    .object({
      value: z.enum(NominationFileOutcome.enum),
      label: z.string(),
      comment: z.string().nullable(),
    })
    .nullable(),
  isArchived: z.boolean(),
  isSessionReported: z.boolean(),
});

const MagistratObservationSchema = z.object({
  id: z.string(),
  dateReception: dateOnlyJsonSchema,
  sessionId: z.string(),
  sessionName: z.string(),
  nominationFileId: z.string(),
  magistratName: z.string(),
  targetedPosition: z.string().nullable(),
});

export class DetailedMagistratDto extends createZodDto(
  z.object({
    id: z.string(),
    civilite: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    usedName: z.string().nullable(),
    grade: z.string().nullable(),
    currentPosition: z.string().nullable(),
    careerHistory: z.string().nullable(),
    externalUrl: z.url(),
    propositions: z.array(MagistratPropositionSchema),
    observations: z.array(MagistratObservationSchema),
  }),
) {}
