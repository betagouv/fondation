import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { DateOnlyJson, dateOnlyJsonSchema } from 'shared-models';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { AffectationVersionFinder } from 'src/modules/session/infrastructure/finders/affectation-version.finder';
import { DateOnly } from 'src/utils/date-only';
import { ObservationFollowUp } from '../../domain/observation-follow-up';

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

const ObservationDetailsSchema = z.object({
  id: z.string(),
  receptionDate: dateOnlyJsonSchema,
  observant: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    usedName: z.string(),
    biography: z.string().nullable(),
    candidacy: CandidacySchema.nullable(),
  }),
  observedMagistrat: z.object({
    name: z.string(),
    proposedPosition: z.string().nullable(),
  }),
  followUp: z.enum(ObservationFollowUp.enum).nullable(),
  followUpComment: z.string().nullable(),
  files: z.array(ObservationFileSchema),
  relatedPropositions: z.array(RelatedPropositionSchema),
  memberComment: z
    .object({
      comment: z.string(),
      screenshots: z.array(ObservationFileSchema),
    })
    .nullable(),
});

export class GetObservationDetailsResponseDto extends createZodDto(
  ObservationDetailsSchema,
) {}

@Injectable()
export class GetObservationDetailsQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly affectationVersionFinder: AffectationVersionFinder,
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

          magistrat: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              usedName: true,
              careerHistory: true,
              observations: {
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
                orderBy: { dateReception: 'desc' },
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

      if (!observation) {
        throw new NotFoundException(
          `Observation with id ${query.observationId} not found`,
        );
      }

      if (!observation.magistrat) {
        throw new NotFoundException(
          `Magistrat for observation ${query.observationId} not found`,
        );
      }

      const magistrat = observation.magistrat;

      const candidacy = await this.findCandidacy(
        tx,
        query.sessionId,
        magistrat.firstName,
        magistrat.lastName,
        magistrat.usedName,
      );

      const relatedPropositions: {
        observationId: string;
        nominationFileId: string;
        number: number | null;
        magistratName: string;
        proposedPosition: string | null;
        observationDate: DateOnlyJson;
      }[] = magistrat.observations.map((obs) => ({
        observationId: obs.id,
        nominationFileId: obs.nominationFile.id,
        number: obs.nominationFile.number,
        magistratName: obs.nominationFile.name,
        proposedPosition: obs.nominationFile.targetedPosition,
        observationDate: DateOnly.fromDate(obs.dateReception).toJson(),
      }));

      const isReporter = await this.affectationVersionFinder.isUserReporter({
        userId: query.userId,
        nominationFileId: query.nominationFileId,
        sessionId: query.sessionId,
        tx,
      });

      const memberCommentFromDb = isReporter
        ? await tx.observationMemberComment.findUnique({
            where: {
              primaryKey: {
                userId: query.userId,
                observationId: query.observationId,
              },
            },
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
          })
        : null;

      const memberComment = isReporter
        ? (memberCommentFromDb ?? {
            comment: '',
            screenshots: [],
          })
        : null;

      return {
        id: observation.id,
        receptionDate: DateOnly.fromDate(observation.dateReception).toJson(),
        followUp: observation.followUp,
        followUpComment: observation.followUpComment,
        observant: {
          id: magistrat.id,
          firstName: magistrat.firstName,
          lastName: magistrat.lastName,
          usedName: magistrat.usedName,
          biography: magistrat.careerHistory,
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
        relatedPropositions,
        memberComment: memberComment
          ? {
              comment: memberComment.comment,
              screenshots: memberComment.screenshots.map(({ file }) => ({
                id: file.id,
                name: file.name,
              })),
            }
          : null,
      };
    });
  }

  private async findCandidacy(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
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
