import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { dateOnlyJsonSchema } from 'shared-models';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { AffectationVersionFinder } from 'src/modules/session/infrastructure/finders/affectation-version.finder';
import { buildMagistratLolfiUrl } from 'src/utils/build-magistrat-lolfi-url';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { ObservationFollowUp } from '../../domain/observation-follow-up';

@Injectable()
export class GetObservationDetailsQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly affectationVersionFinder: AffectationVersionFinder,
    private readonly files: Files,
  ) {}

  async handle(query: {
    userId: string;
    sessionId: string;
    nominationFileId: string;
    observationId: string;
  }): Promise<GetObservationDetailsResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const observation = await tx.observation.findUnique({
        where: {
          id: query.observationId,
          nominationFileId: query.nominationFileId,
        },
        select: {
          id: true,
          dateReception: true,
          followUp: true,
          followUpComment: true,
          description: true,

          memberComments: {
            take: 1,
            where: { userId: query.userId },
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
          },

          magistrat: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              usedName: true,
              careerHistory: true,
              externalId: true,
              observations: {
                orderBy: { dateReception: 'desc' },
                where: {
                  id: { not: query.observationId },
                  nominationFile: { sessionId: query.sessionId },
                },
                select: {
                  id: true,
                  dateReception: true,
                  nominationFile: {
                    select: {
                      id: true,
                      number: true,
                      name: true,
                      targetedPosition: true,
                    },
                  },
                },
              },
            },
          },

          nominationFile: {
            select: {
              name: true,
              targetedPosition: true,
            },
          },

          files: {
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
      });

      if (!observation || !observation.magistrat) {
        throw new NotFoundException();
      }

      const reporterIds = await this.affectationVersionFinder.findReporterIds({
        tx,
        sessionId: query.sessionId,
        nominationFileId: query.nominationFileId,
      });
      const isUserReporter = reporterIds.includes(query.userId);

      const candidacy = await this.findRelatedNominationFiles(
        tx,
        query.sessionId,
        observation.magistrat.firstName,
        observation.magistrat.lastName,
        observation.magistrat.usedName,
      );

      return {
        id: observation.id,
        receptionDate: DateOnly.fromDate(observation.dateReception).toJson(),
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
        },
        files: observation.files.map(({ file }) => ({
          id: file.id,
          name: file.name,
        })),
        relatedPropositions: observation.magistrat.observations.map((obs) => ({
          observationId: obs.id,
          nominationFileId: obs.nominationFile.id,
          number: obs.nominationFile.number,
          magistratName: obs.nominationFile.name,
          proposedPosition: obs.nominationFile.targetedPosition,
          observationDate: DateOnly.fromDate(obs.dateReception).toJson(),
        })),

        isMemberReporter: isUserReporter,
        memberComment: observation.memberComments[0]
          ? {
              comment: observation.memberComments[0].comment,
              screenshots: await this.withUrls(
                observation.memberComments[0].screenshots.map(
                  ({ file }) => file,
                ),
              ),
            }
          : null,
      };
    });
  }

  private async withUrls<T extends { id: string }>(
    files: readonly T[],
  ): Promise<(T & { url: string })[]> {
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
    tx: Prisma.TransactionClient,
    sessionId: string,
    firstName: string,
    lastName: string,
    usedName: string,
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

    const dossier = await tx.dossierDeNomination.findFirst({
      where: {
        sessionId,
        OR: searchPatterns.map((pattern) => ({ name: pattern })),
      },
      select: {
        id: true,
        targetedPosition: true,
        rank: true,
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
    receptionDate: dateOnlyJsonSchema,
    observant: z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      usedName: z.string(),
      biography: z.string().nullable(),
      candidacy: CandidacySchema.nullable(),
      externalUrl: z.url(),
    }),
    observedMagistrat: z.object({
      name: z.string(),
      proposedPosition: z.string().nullable(),
    }),
    description: z.string(),
    followUp: z.enum(ObservationFollowUp.enum).nullable(),
    followUpComment: z.string().nullable(),
    files: z.array(ObservationFileSchema),
    relatedPropositions: z.array(RelatedPropositionSchema),
    isMemberReporter: z.boolean(),
    memberComment: z
      .object({
        comment: z.string(),
        screenshots: z.array(
          ObservationFileSchema.safeExtend({ url: z.url() }),
        ),
      })
      .nullable(),
  }),
) {}
