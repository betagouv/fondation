import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat, PrioriteEnum } from 'shared-models';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import {
  FILE_MIME_TYPES,
  filenameToMimeType,
} from 'src/modules/framework/files/mime-type';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { isGrade } from 'src/modules/shared/mappers/grade.mapper';
import { prismaPrioriteEnumToPrioriteEnum } from 'src/modules/shared/mappers/priorite.mapper';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';

import { NominationFileOutcome } from '../../domain/nomination-file-outcome';

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
      where: { id: query.sessionId },
      select: {
        id: true,
        formation: true,
        dossierDeNominations: {
          where: { id: query.nominationFileId },
          select: {
            id: true,
            number: true,
            name: true,
            outcome: true,
            outcomeComment: true,
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

    if (
      !session ||
      !session.dossierDeNominations ||
      !session.dossierDeNominations.length
    ) {
      throw new NotFoundException();
    }

    const [nominationFile] = session.dossierDeNominations;
    if (!nominationFile) throw new NotFoundException();

    const summary = nominationFile.summary;
    if (!summary) throw new NotFoundException();

    const allAllowedReaders = new Set(
      [
        summary.author?.id,
        ...summary.readers.map(({ user }) => user.id),
      ].filter(isDefined),
    );

    if (!allAllowedReaders.has(query.userId)) {
      this.logger.error(
        `Unauthorized access attempt from ${query.userId} to ${query.nominationFileId}`,
        query,
      );
      throw new NotFoundException();
    }

    return {
      id: nominationFile.id,
      sessionId: session.id,
      name: nominationFile.name,
      number: nominationFile.number,
      position: nominationFile.currentPosition,
      rank: nominationFile.rank,
      targetedPosition: nominationFile.targetedPosition,
      biography: nominationFile.biography ?? '',
      formation: prismaFormationEnumToFormationEnum(session.formation),
      grade: isGrade(nominationFile.grade) ? nominationFile.grade : null,
      targetedGrade: isGrade(nominationFile.targetedGrade)
        ? nominationFile.targetedGrade
        : null,
      birthDate:
        DateOnly.fromOptionalDate(nominationFile.birthDate)?.toJson() ?? null,
      lastRankingDate:
        DateOnly.fromOptionalDate(nominationFile.lastRankingDate)?.toJson() ??
        null,
      lastPositionDate:
        DateOnly.fromOptionalDate(nominationFile.lastPositionDate)?.toJson() ??
        null,
      priorities: nominationFile.priorities.map(
        prismaPrioriteEnumToPrioriteEnum,
      ),
      priority: nominationFile.priorities[0]
        ? prismaPrioriteEnumToPrioriteEnum(nominationFile.priorities[0])
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
            const byId = new Map(
              summary.screenshots.map(({ file }) => [file.id, file]),
            );

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
    name: z.string().nullable(),
    rank: z.string().nullable(),
    formation: z.enum(Magistrat.Formation),
    number: z.number().int().gte(1).nullable(),
    birthDate: dateOnlyJsonSchema.nullable(),
    grade: z.enum(Magistrat.Grade).nullable(),
    position: z.string().nullable(),
    targetedGrade: z.enum(Magistrat.Grade).nullable(),
    targetedPosition: z.string().nullable(),
    priorities: z.array(z.enum(PrioriteEnum)),
    priority: z
      .enum(PrioriteEnum)
      .nullable()
      .meta({ deprecated: true, description: 'prefer priorities' }),
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
        comment: z.string().nullable(),
      })
      .nullable(),

    summary: z.object({
      content: z.string(),
      updatedAt: z.iso.datetime(),
      author: z
        .object({ id: z.string(), firstName: z.string(), lastName: z.string() })
        .nullable(),
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
