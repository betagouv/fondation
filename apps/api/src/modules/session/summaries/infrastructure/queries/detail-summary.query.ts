import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { FILE_MIME_TYPES, filenameToMimeType } from 'src/modules/framework/files/mime-type';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { isGrade } from 'src/modules/shared/mappers/grade.mapper';
import { prismaPrioriteEnumToPriorityEnum } from 'src/modules/shared/mappers/priorite.mapper';
import {
  NominationFileOutcome,
  nominationFileOutcomeLabel,
} from 'src/modules/shared/nomination-file-outcome.enum';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';
import { fullname } from 'src/utils/user.util';

@Injectable()
export class DetailSummaryQuery {
  private readonly logger = new Logger(DetailSummaryQuery.name);

  constructor(
    private readonly db: Db,
    private readonly files: Files,
  ) {}

  async handle(query: {
    nominationFileId: string;
    sessionId: string;
    userId: string;
  }): Promise<DetailedSummaryDto> {
    const session = await this.db.tx.session.findUnique({
      select: {
        archivedAt: true,
        dossierDeNominations: {
          select: {
            auditionDate: true,
            auditionTime: true,
            biography: true,
            birthDate: true,
            currentPosition: true,
            detectedMagistratId: true,
            grade: true,
            lastPositionDate: true,
            missingEvaluation: true,
            name: true,
            observers: true,
            outcome: true,
            outcomeComment: true,
            priorities: true,
            rank: true,
            summary: {
              select: {
                attachments: {
                  select: {
                    file: {
                      select: {
                        createdAt: true,
                        createdBy: { select: { firstName: true, id: true, lastName: true } },
                        id: true,
                        name: true,
                        sizeInBytes: true,
                      },
                    },
                  },
                },
                author: {
                  select: { firstName: true, id: true, lastName: true },
                },
                content: true,
                readers: {
                  select: {
                    user: {
                      select: {
                        firstName: true,
                        id: true,
                        lastName: true,
                      },
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
            targetedGrade: true,
            targetedPosition: true,
          },
          where: { id: query.nominationFileId },
        },
        formation: true,
      } satisfies Prisma.SessionSelect,
      where: { deletedAt: null, id: query.sessionId },
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
      isArchived: !!session.archivedAt,
      name: nominationFile.name,
      detectedMagistratId: nominationFile.detectedMagistratId,
      position: nominationFile.currentPosition,
      rank: nominationFile.rank,
      targetedPosition: nominationFile.targetedPosition,
      biography: nominationFile.biography ?? '',
      grade: isGrade(nominationFile.grade) ? nominationFile.grade : null,
      targetedGrade: isGrade(nominationFile.targetedGrade) ? nominationFile.targetedGrade : null,
      birthDate: DateOnly.fromOptionalUtcDate(nominationFile.birthDate)?.toJson() ?? null,
      auditionDate: DateOnly.fromOptionalUtcDate(nominationFile.auditionDate)?.toJson() ?? null,
      auditionTime: nominationFile.auditionTime ? dateToTimeOnly(nominationFile.auditionTime) : null,
      missingEvaluation: nominationFile.missingEvaluation,
      lastPositionDate: DateOnly.fromOptionalUtcDate(nominationFile.lastPositionDate)?.toJson() ?? null,
      priorities: nominationFile.priorities.map(prismaPrioriteEnumToPriorityEnum),

      observers: nominationFile.observers,

      outcome: nominationFile.outcome
        ? {
            value: nominationFile.outcome,
            label: nominationFileOutcomeLabel({
              formation: prismaFormationEnumToFormationEnum(session.formation),
              outcome: nominationFile.outcome,
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
        readers: summary.readers.map(({ user }) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        })),

        attachments: summary.attachments.map(({ file }) => ({
          addedAt: file.createdAt.toISOString(),
          addedBy: file.createdBy ? { id: file.createdBy.id, name: fullname(file.createdBy) } : null,
          id: file.id,
          name: file.name,
          size: file.sizeInBytes,
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
    isArchived: z.boolean(),
    name: z.string().nullable(),
    detectedMagistratId: z.string().nullable(),
    rank: z.string().nullable(),
    birthDate: dateOnlyJsonSchema.nullable(),
    auditionDate: dateOnlyJsonSchema.nullable(),
    auditionTime: timeOnlySchema.nullable(),
    missingEvaluation: z.boolean(),
    grade: z.enum(GradeEnum).nullable(),
    position: z.string().nullable(),
    targetedGrade: z.enum(GradeEnum).nullable(),
    targetedPosition: z.string().nullable(),
    priorities: z.array(z.enum(PriorityEnum)),
    biography: z.string(),
    lastPositionDate: dateOnlyJsonSchema.nullable(),

    observers: z.array(z.string()),

    outcome: z
      .object({
        value: z.enum(NominationFileOutcome.enum),
        label: z.string(),
        comment: z.string().nullable(),
      })
      .nullable(),

    summary: z.object({
      content: z.string(),
      author: z.object({ id: z.string(), firstName: z.string(), lastName: z.string() }).nullable(),
      attachments: z.array(
        z.object({
          addedAt: z.iso.datetime(),
          addedBy: z.object({ id: z.string(), name: z.string() }).nullable(),
          id: z.string(),
          name: z.string(),
          size: z.number().int().nullable(),
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
