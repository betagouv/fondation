import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { FILE_MIME_TYPES, filenameToMimeType } from 'src/modules/framework/files/mime-type';
import {
  NominationFileOutcome,
  nominationFileOutcomeLabel,
} from 'src/modules/session/shared/types/nomination-file-outcome';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { isGrade } from 'src/modules/shared/mappers/grade.mapper';
import { prismaPrioriteEnumToPriorityEnum } from 'src/modules/shared/mappers/priorite.mapper';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class DetailSummaryQuery {
  private readonly logger = new Logger(DetailSummaryQuery.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async handle(query: {
    nominationFileId: string;
    sessionId: string;
    userId: string;
  }): Promise<DetailedSummaryDto> {
    const session = await this.prisma.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
      select: {
        id: true,
        formation: true,
        archivedAt: true,
        dossierDeNominations: {
          where: { id: query.nominationFileId },
          select: {
            id: true,
            number: true,
            name: true,
            detectedMagistratId: true,
            outcome: true,
            outcomeComment: true,
            auditionDate: true,
            auditionTime: true,
            targetedGrade: true,
            targetedPosition: true,
            lastPositionDate: true,
            lastRankingDate: true,
            priorities: true,
            birthDate: true,
            careerInformation: true,
            currentPosition: true,
            grade: true,
            biography: true,
            rank: true,
            observers: true,
            observations: {
              select: {
                id: true,
                magistrat: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    usedName: true,
                  },
                },
              },
            },
            summary: {
              select: {
                author: {
                  select: { id: true, firstName: true, lastName: true },
                },
                content: true,
                updatedAt: true,
                readers: {
                  select: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
                attachments: {
                  select: {
                    file: {
                      select: { id: true, name: true },
                    },
                  },
                },
                screenshots: {
                  select: {
                    file: { select: { id: true, name: true, path: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session || !session.dossierDeNominations || !session.dossierDeNominations.length) {
      throw new NotFoundException();
    }

    const [nominationFile] = session.dossierDeNominations;
    if (!nominationFile) throw new NotFoundException();

    const summary = nominationFile.summary;
    if (!summary) throw new NotFoundException();

    const allAllowedReaders = new Set(
      [summary.author?.id, ...summary.readers.map(({ user }) => user.id)].filter(isDefined),
    );

    if (summary.author && !allAllowedReaders.has(query.userId)) {
      this.logger.error(
        `Unauthorized access attempt from ${query.userId} to ${query.nominationFileId}`,
        query,
      );
      throw new NotFoundException();
    }

    return {
      id: nominationFile.id,
      sessionId: session.id,
      isArchived: !!session.archivedAt,
      name: nominationFile.name,
      detectedMagistratId: nominationFile.detectedMagistratId,
      number: nominationFile.number,
      position: nominationFile.currentPosition,
      rank: nominationFile.rank,
      targetedPosition: nominationFile.targetedPosition,
      biography: nominationFile.biography ?? '',
      formation: prismaFormationEnumToFormationEnum(session.formation),
      grade: isGrade(nominationFile.grade) ? nominationFile.grade : null,
      targetedGrade: isGrade(nominationFile.targetedGrade) ? nominationFile.targetedGrade : null,
      birthDate: DateOnly.fromOptionalDate(nominationFile.birthDate)?.toJson() ?? null,
      auditionDate: DateOnly.fromOptionalDate(nominationFile.auditionDate)?.toJson() ?? null,
      auditionTime: nominationFile.auditionTime ? dateToTimeOnly(nominationFile.auditionTime) : null,
      lastRankingDate: DateOnly.fromOptionalDate(nominationFile.lastRankingDate)?.toJson() ?? null,
      lastPositionDate: DateOnly.fromOptionalDate(nominationFile.lastPositionDate)?.toJson() ?? null,
      priorities: nominationFile.priorities.map(prismaPrioriteEnumToPriorityEnum),
      priority: nominationFile.priorities[0]
        ? prismaPrioriteEnumToPriorityEnum(nominationFile.priorities[0])
        : null,

      observers: nominationFile.observers,
      observations: nominationFile.observations.map((o) => ({
        id: o.id,
        magistrat: {
          id: o.magistrat.id,
          firstName: o.magistrat.firstName,
          lastName: o.magistrat.lastName,
          usedName: o.magistrat.usedName,
        },
      })),

      outcome: nominationFile.outcome
        ? {
            value: nominationFile.outcome,
            label: nominationFileOutcomeLabel({
              outcome: nominationFile.outcome,
              formation: prismaFormationEnumToFormationEnum(session.formation),
            }),
            comment: nominationFile.outcomeComment,
          }
        : null,

      summary: {
        content: summary.content,
        author: summary.author
          ? {
              id: summary.author.id,
              firstName: summary.author.firstName,
              lastName: summary.author.lastName,
            }
          : null,
        updatedAt: summary.updatedAt.toISOString(),
        readers: summary.readers.map(({ user }) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        })),

        attachments: summary.attachments.map(({ file }) => ({
          id: file.id,
          name: file.name,
          type: filenameToMimeType(file.name) ?? FILE_MIME_TYPES.bin,
        })),

        screenshots: await this.files
          .getPublicUrls(summary.screenshots.map(({ file }) => file.id))
          .then((urls) => {
            const byId = new Map(summary.screenshots.map(({ file }) => [file.id, file]));

            return Object.entries(urls)
              .map(([id, url]) => {
                const file = byId.get(id);
                if (!file) return null;
                return {
                  id: file.id,
                  name: file.name,
                  type: filenameToMimeType(file.name) ?? FILE_MIME_TYPES.bin,
                  url: url.toString(),
                };
              })
              .filter(isDefined);
          }),
      },
    };
  }
}

export class DetailedSummaryDto extends createZodDto(
  z.object({
    id: z.string(),
    sessionId: z.string(),
    isArchived: z.boolean(),
    name: z.string().nullable(),
    detectedMagistratId: z.string().nullable(),
    rank: z.string().nullable(),
    formation: z.enum(FormationEnum),
    number: z.number().int().gte(1).nullable(),
    birthDate: dateOnlyJsonSchema.nullable(),
    auditionDate: dateOnlyJsonSchema.nullable(),
    auditionTime: timeOnlySchema.nullable(),
    grade: z.enum(GradeEnum).nullable(),
    position: z.string().nullable(),
    targetedGrade: z.enum(GradeEnum).nullable(),
    targetedPosition: z.string().nullable(),
    priorities: z.array(z.enum(PriorityEnum)),
    priority: z.enum(PriorityEnum).nullable().meta({ deprecated: true, description: 'prefer priorities' }),
    biography: z.string(),
    lastRankingDate: dateOnlyJsonSchema.nullable(),
    lastPositionDate: dateOnlyJsonSchema.nullable(),

    observers: z.array(z.string()),
    observations: z.array(
      z.object({
        id: z.string(),
        magistrat: z.object({
          id: z.string(),
          firstName: z.string(),
          usedName: z.string().nullable(),
          lastName: z.string(),
        }),
      }),
    ),

    outcome: z
      .object({
        value: z.enum(NominationFileOutcome.enum),
        label: z.string(),
        comment: z.string().nullable(),
      })
      .nullable(),

    summary: z.object({
      content: z.string(),
      updatedAt: z.iso.datetime(),
      author: z.object({ id: z.string(), firstName: z.string(), lastName: z.string() }).nullable(),
      attachments: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
        }),
      ),
      screenshots: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          url: z.url(),
        }),
      ),
      readers: z.array(
        z.object({
          id: z.string(),
          firstName: z.string(),
          lastName: z.string(),
        }),
      ),
    }),
  }),
) {}
