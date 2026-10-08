import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { FILE_MIME_TYPES, filenameToMimeType } from 'src/modules/framework/files/mime-type';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { isGrade } from 'src/modules/shared/mappers/grade.mapper';
import { prismaPrioriteEnumToPriorityEnum } from 'src/modules/shared/mappers/priorite.mapper';
import {
  NominationFileOutcome,
  nominationFileOutcomeLabel,
} from 'src/modules/shared/nomination-file-outcome.enum';
import {
  AUDITION_REQUIREMENTS,
  expectedReportersCount,
} from 'src/modules/shared/policies/auditioned-position.policy';
import { canScheduleAudition } from 'src/modules/shared/policies/nomination-file.policies';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { timeOnlySchema } from 'src/utils/time-only';
import { fullname } from 'src/utils/user.util';

@Injectable()
export class DetailSummaryQuery {
  private readonly logger = new Logger(DetailSummaryQuery.name);

  constructor(
    private readonly db: Db,
    private readonly files: Files,

    @Inject(forwardRef(() => TransparenceService))
    private readonly transparences: TransparenceService,
  ) {}

  private async areReportersMissing(query: {
    expectedReportersCount: number | null;
    isArchived: boolean;
    nominationFileId: string;
    sessionId: string;
  }): Promise<boolean> {
    if (query.expectedReportersCount === null || query.isArchived) return false;

    const affectation = await this.transparences.internalFindReportersAffectation(query);
    return !affectation.isLocked && affectation.reportersCount < query.expectedReportersCount;
  }

  async handle(query: {
    nominationFileId: string;
    role: RoleEnum;
    sessionId: string;
    userId: string;
  }): Promise<DetailedSummaryDto> {
    const session = await this.db.tx.session.findUnique({
      select: {
        archivedAt: true,
        dossierDeNominations: {
          select: {
            biography: true,
            birthDate: true,
            currentPosition: true,
            detectedJurisdiction: { select: { typeJur: true } },
            detectedJurisdictionId: true,
            detectedMagistratId: true,
            detectedTargetedFunctionId: true,
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

    const audition = await this.transparences.internalFindSeenNominationFileAudition({
      nominationFileId: query.nominationFileId,
      role: query.role,
    });
    const auditionedPosition = {
      ...nominationFile,
      detectedJurisdictionType: nominationFile.detectedJurisdiction?.typeJur ?? null,
    };

    return {
      ...audition,
      biography: nominationFile.biography ?? '',
      birthDate: DateOnly.fromOptionalUtcDate(nominationFile.birthDate)?.toJson() ?? null,
      canScheduleAudition: canScheduleAudition(nominationFile, session),
      detectedMagistratId: nominationFile.detectedMagistratId,
      grade: isGrade(nominationFile.grade) ? nominationFile.grade : null,
      isArchived: !!session.archivedAt,
      lastPositionDate: DateOnly.fromOptionalUtcDate(nominationFile.lastPositionDate)?.toJson() ?? null,
      missingEvaluation: nominationFile.missingEvaluation,
      name: nominationFile.name,
      observers: nominationFile.observers,
      outcome: nominationFile.outcome
        ? {
            comment: nominationFile.outcomeComment,
            label: nominationFileOutcomeLabel({
              formation: prismaFormationEnumToFormationEnum(session.formation),
              outcome: nominationFile.outcome,
            }),
            status: NominationFileOutcome.statusOf(nominationFile.outcome),
            value: nominationFile.outcome,
          }
        : null,
      position: nominationFile.currentPosition,
      priorities: nominationFile.priorities.map(prismaPrioriteEnumToPriorityEnum),
      rank: nominationFile.rank,
      reportersMissing: await this.areReportersMissing({
        expectedReportersCount: expectedReportersCount(auditionedPosition),
        isArchived: !!session.archivedAt,
        nominationFileId: query.nominationFileId,
        sessionId: query.sessionId,
      }),
      summary: {
        attachments: summary.attachments.map(({ file }) => ({
          addedAt: file.createdAt.toISOString(),
          addedBy: file.createdBy ? { id: file.createdBy.id, name: fullname(file.createdBy) } : null,
          id: file.id,
          name: file.name,
          size: file.sizeInBytes,
          type: filenameToMimeType(file.name) ?? FILE_MIME_TYPES.bin,
        })),
        author: summary.author
          ? {
              firstName: summary.author.firstName,
              id: summary.author.id,
              lastName: summary.author.lastName,
            }
          : null,
        content: summary.content,
        readers: summary.readers.map(({ user }) => ({
          firstName: user.firstName,
          id: user.id,
          lastName: user.lastName,
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
      targetedGrade: isGrade(nominationFile.targetedGrade) ? nominationFile.targetedGrade : null,
      targetedPosition: nominationFile.targetedPosition,
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
    auditionRequired: z.boolean(),
    auditionRequirement: z.enum(AUDITION_REQUIREMENTS).nullable(),
    auditionTime: timeOnlySchema.nullable(),
    canScheduleAudition: z.boolean(),
    reportersMissing: z.boolean(),
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
        status: z.enum(NominationFileOutcome.statuses),
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
