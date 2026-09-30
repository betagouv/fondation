import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { ObservationFollowUp } from '../../domain/observation-follow-up';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
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
              observations: {
                orderBy: { dateReception: 'desc' },
                select: {
                  dateReception: true,
                  id: true,
                  nominationFile: {
                    select: {
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
              usedName: true,
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

      const candidacy = await this.findRelatedNominationFiles(
        query.sessionId,
        observation.magistrat.firstName,
        observation.magistrat.lastName,
        observation.magistrat.usedName,
      );

      return {
        id: observation.id,
        isArchived: !!session?.archivedAt,
        receptionDate: DateOnly.fromUtcDate(observation.dateReception).toJson(),
        followUp: observation.followUp,
        followUpComment: observation.followUpComment,
        description: observation.description,
        observant: {
          id: observation.magistrat.id,
          firstName: observation.magistrat.firstName,
          lastName: observation.magistrat.lastName,
          usedName: observation.magistrat.usedName,
          biography: observation.magistrat.careerHistory,
          externalUrl: buildMagistratLolfiUrl(observation.magistrat.externalId),
          candidacy,
        },
        observedMagistrat: {
          name: observation.nominationFile.name,
          proposedPosition: observation.nominationFile.targetedPosition,
          detectedMagistratId: observation.nominationFile.detectedMagistratId,
        },
        files: observation.files.map(({ file }) => ({
          id: file.id,
          name: file.name,
          size: file.sizeInBytes,
          addedAt: file.createdAt.toISOString(),
          addedBy: file.createdBy ? { id: file.createdBy.id, name: fullname(file.createdBy) } : null,
        })),
        relatedPropositions: observation.magistrat.observations.map((obs) => ({
          observationId: obs.id,
          nominationFileId: obs.nominationFile.id,
          number: obs.nominationFile.number,
          magistratName: obs.nominationFile.name,
          proposedPosition: obs.nominationFile.targetedPosition,
          observationDate: DateOnly.fromUtcDate(obs.dateReception).toJson(),
        })),

        isMemberReporter: isUserReporter,
        memberComment: observation.memberComments[0]
          ? {
              comment: observation.memberComments[0].comment,
              screenshots: await this.withUrls(
                observation.memberComments[0].screenshots.map(({ file }) => file),
              ),
            }
          : null,
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

  private async findRelatedNominationFiles(
    sessionId: string,
    firstName: string,
    lastName: string,
    usedName: string | null,
  ): Promise<{
    nominationFileId: string;
    desiredPosition: string | null;
    rank: string | null;
  } | null> {
    const searchPatterns = [
      {
        contains: `${lastName.toUpperCase()} ${firstName}`,
        mode: 'insensitive' as const,
      },
    ];

    if (usedName && usedName !== lastName) {
      searchPatterns.push(
        {
          contains: `${usedName.toUpperCase()} ${firstName}`,
          mode: 'insensitive' as const,
        },
        { contains: usedName, mode: 'insensitive' as const },
      );
    }

    const dossier = await this.db.tx.dossierDeNomination.findFirst({
      select: {
        id: true,
        rank: true,
        targetedPosition: true,
      } satisfies Prisma.DossierDeNominationSelect,
      where: {
        OR: searchPatterns.map((pattern) => ({ name: pattern })),
        sessionId,
      },
    });

    if (!dossier) return null;

    return {
      nominationFileId: dossier.id,
      desiredPosition: dossier.targetedPosition,
      rank: dossier.rank,
    };
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

const CandidacySchema = z.object({
  nominationFileId: z.string(),
  desiredPosition: z.string().nullable(),
  rank: z.string().nullable(),
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
      firstName: z.string(),
      lastName: z.string(),
      usedName: z.string().nullable(),
      biography: z.string().nullable(),
      candidacy: CandidacySchema.nullable(),
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
