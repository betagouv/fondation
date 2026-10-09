import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { ObservantAudition, UNSCHEDULABLE_REASONS } from '../../domain/observant-audition';
import { ObservationFollowUp } from '../../domain/observation-follow-up';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { magistratFullName, proposedMagistratName } from 'src/modules/magistrat/domain/magistrat-name';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { auditionScheduleSchema } from 'src/utils/audition-schedule';
import { buildMagistratLolfiUrl } from 'src/utils/build-magistrat-lolfi-url';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { fullname } from 'src/utils/user.util';

@Injectable()
export class GetObservationDetailsQuery {
  constructor(
    private readonly db: Db,
    private readonly files: Files,

    @Inject(forwardRef(() => TransparenceService))
    private readonly transparences: TransparenceService,
  ) {}

  async handle(query: {
    nominationFileId: string;
    observationId: string;
    role: RoleEnum;
    sessionId: string;
    userId: string;
  }): Promise<GetObservationDetailsResponseDto> {
    return this.db.withTransaction(async () => {
      const session = await this.db.tx.session.findUnique({
        select: { archivedAt: true } satisfies Prisma.SessionSelect,
        where: { id: query.sessionId },
      });

      const observation = await this.db.tx.observation.findUnique({
        select: {
          dateReception: true,
          description: true,
          files: {
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
          followUp: true,
          followUpComment: true,
          id: true,
          magistrat: {
            select: {
              careerHistory: true,
              externalId: true,
              firstName: true,
              id: true,
              lastName: true,
              marriedName: true,
              observations: {
                orderBy: { dateReception: 'desc' },
                select: {
                  dateReception: true,
                  id: true,
                  nominationFile: {
                    select: {
                      detectedMagistrat: { select: { firstName: true, lastName: true, marriedName: true } },
                      id: true,
                      name: true,
                      number: true,
                      targetedPosition: true,
                    },
                  },
                },
                where: {
                  id: { not: query.observationId },
                  nominationFile: { sessionId: query.sessionId },
                },
              },
            },
          },
          memberComments: {
            select: {
              comment: true,
              screenshots: {
                select: {
                  file: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            take: 1,
            where: { userId: query.userId },
          },
          nominationFile: {
            select: {
              detectedMagistrat: { select: { firstName: true, lastName: true, marriedName: true } },
              detectedMagistratId: true,
              name: true,
              targetedPosition: true,
            },
          },
        } satisfies Prisma.ObservationSelect,
        where: {
          id: query.observationId,
          nominationFileId: query.nominationFileId,
        },
      });

      if (!observation || !observation.magistrat) {
        throw new NotFoundException();
      }

      const reporters = await this.transparences.versions.findReporters({
        nominationFileId: query.nominationFileId,
        sessionId: query.sessionId,
      });
      const isUserReporter = reporters.some(({ id }) => id === query.userId);

      const observedNominationFiles = await this.transparences.internalFindAuditionStates({
        nominationFileIds: [
          query.nominationFileId,
          ...observation.magistrat.observations.map(({ nominationFile }) => nominationFile.id),
        ],
        sessionId: query.sessionId,
      });
      const auditions = await this.transparences.internalFindSeenObservantAuditions({
        magistratIds: [observation.magistrat.id],
        role: query.role,
        sessionId: query.sessionId,
      });

      return {
        description: observation.description,
        files: observation.files.map(({ file }) => ({
          addedAt: file.createdAt.toISOString(),
          addedBy: file.createdBy ? { id: file.createdBy.id, name: fullname(file.createdBy) } : null,
          id: file.id,
          name: file.name,
          size: file.sizeInBytes,
        })),
        followUp: observation.followUp,
        followUpComment: observation.followUpComment,
        id: observation.id,
        isArchived: !!session?.archivedAt,
        isMemberReporter: isUserReporter,
        memberComment: observation.memberComments[0]
          ? {
              comment: observation.memberComments[0].comment,
              screenshots: await this.withUrls(
                observation.memberComments[0].screenshots.map(({ file }) => file),
              ),
            }
          : null,
        observant: {
          audition: auditions.get(observation.magistrat.id) ?? null,
          auditionScheduling: ObservantAudition.unschedulableReason(observedNominationFiles) ?? 'SCHEDULABLE',
          biography: observation.magistrat.careerHistory,
          externalUrl: buildMagistratLolfiUrl(observation.magistrat.externalId),
          id: observation.magistrat.id,
          name: magistratFullName(observation.magistrat),
        },
        observedMagistrat: {
          detectedMagistratId: observation.nominationFile.detectedMagistratId,
          name: proposedMagistratName(observation.nominationFile),
          proposedPosition: observation.nominationFile.targetedPosition,
        },
        receptionDate: DateOnly.fromUtcDate(observation.dateReception).toJson(),
        relatedPropositions: observation.magistrat.observations.map((obs) => ({
          magistratName: proposedMagistratName(obs.nominationFile),
          nominationFileId: obs.nominationFile.id,
          number: obs.nominationFile.number,
          observationDate: DateOnly.fromUtcDate(obs.dateReception).toJson(),
          observationId: obs.id,
          proposedPosition: obs.nominationFile.targetedPosition,
        })),
      };
    });
  }

  private async withUrls<T extends { id: string }>(files: readonly T[]): Promise<(T & { url: string })[]> {
    const byId = new Map(files.map((file) => [file.id, file] as const));
    const ids = Array.from(byId.keys());

    const urls = await this.files.getPublicUrls(ids);
    return Object.entries(urls)
      .map(([id, url]) => {
        const screenshot = byId.get(id);
        if (!screenshot) return null;

        return { ...screenshot, url: url.toString() };
      })
      .filter(isDefined);
  }
}

const ObservationAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number().int().nullable(),
  addedAt: z.iso.datetime(),
  addedBy: z.object({ id: z.string(), name: z.string() }).nullable(),
});

const ObservationFileSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const RelatedPropositionSchema = z.object({
  observationId: z.string(),
  nominationFileId: z.string(),
  number: z.number().nullable(),
  magistratName: z.string(),
  proposedPosition: z.string().nullable(),
  observationDate: dateOnlyJsonSchema,
});

export class GetObservationDetailsResponseDto extends createZodDto(
  z.object({
    id: z.string(),
    isArchived: z.boolean(),
    receptionDate: dateOnlyJsonSchema,
    observant: z.object({
      id: z.string(),
      name: z.string(),
      biography: z.string().nullable(),
      audition: auditionScheduleSchema.nullable(),
      auditionScheduling: z.enum(['SCHEDULABLE', ...UNSCHEDULABLE_REASONS]),
      externalUrl: z.url(),
    }),
    observedMagistrat: z.object({
      name: z.string(),
      proposedPosition: z.string().nullable(),
      detectedMagistratId: z.string().nullable(),
    }),
    description: z.string(),
    followUp: z.enum(ObservationFollowUp.enum).nullable(),
    followUpComment: z.string().nullable(),
    files: z.array(ObservationAttachmentSchema),
    relatedPropositions: z.array(RelatedPropositionSchema),
    isMemberReporter: z.boolean(),
    memberComment: z
      .object({
        comment: z.string(),
        screenshots: z.array(ObservationFileSchema.safeExtend({ url: z.url() })),
      })
      .nullable(),
  }),
) {}
