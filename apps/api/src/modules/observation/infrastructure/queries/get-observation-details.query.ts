import { Injectable, NotFoundException } from '@nestjs/common';
import { format } from 'date-fns';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';

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
  observationDate: z.string(),
});

const ObservationDetailsSchema = z.object({
  id: z.string(),
  receptionDate: z.string().describe('Reception date formatted as DD/MM/YYYY'),
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
  files: z.array(ObservationFileSchema),
  relatedPropositions: z.array(RelatedPropositionSchema),
});

export class GetObservationDetailsResponseDto extends createZodDto(
  ObservationDetailsSchema,
) {}

@Injectable()
export class GetObservationDetailsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    sessionId: string;
    nominationFileId: string;
    observationId: string;
  }): Promise<GetObservationDetailsResponseDto> {
    const observation = await this.prisma.observation.findUnique({
      where: {
        id: query.observationId,
        nominationFileId: query.nominationFileId,
      },
      select: {
        id: true,
        dateReception: true,
        magistrat: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            usedName: true,
            careerHistory: true,
          },
        },
        nominationFile: {
          select: {
            name: true,
            targetedPosition: true,
            sessionId: true,
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
      query.sessionId,
      magistrat.firstName,
      magistrat.lastName,
      magistrat.usedName,
    );

    const relatedPropositions = await this.findRelatedPropositions(
      query.sessionId,
      magistrat.id,
      query.observationId,
    );

    return {
      id: observation.id,
      receptionDate: format(observation.dateReception, 'dd/MM/yyyy'),
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
    };
  }

  private async findCandidacy(
    sessionId: string,
    firstName: string,
    lastName: string,
    usedName: string,
  ): Promise<{
    nominationFileId: string;
    desiredPosition: string | null;
    rank: string | null;
  } | null> {
    const searchPatterns: string[] = [`${lastName.toUpperCase()} ${firstName}`];
    if (usedName && usedName !== lastName) {
      searchPatterns.push(`${usedName.toUpperCase()} ${firstName}`);
      searchPatterns.push(usedName);
    }

    for (const pattern of searchPatterns) {
      const dossier = await this.prisma.dossierDeNomination.findFirst({
        where: {
          sessionId,
          name: {
            contains: pattern,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          targetedPosition: true,
          rank: true,
        },
      });

      if (dossier) {
        return {
          nominationFileId: dossier.id,
          desiredPosition: dossier.targetedPosition,
          rank: dossier.rank,
        };
      }
    }

    return null;
  }

  private async findRelatedPropositions(
    sessionId: string,
    magistratId: string,
    currentObservationId: string,
  ): Promise<
    {
      observationId: string;
      nominationFileId: string;
      number: number | null;
      magistratName: string;
      proposedPosition: string | null;
      observationDate: string;
    }[]
  > {
    const otherObservations = await this.prisma.observation.findMany({
      where: {
        magistratId,
        nominationFile: {
          sessionId,
        },
        id: {
          not: currentObservationId,
        },
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
      orderBy: {
        dateReception: 'desc',
      },
    });

    return otherObservations.map((obs) => ({
      observationId: obs.id,
      nominationFileId: obs.nominationFile.id,
      number: obs.nominationFile.number,
      magistratName: obs.nominationFile.name,
      proposedPosition: obs.nominationFile.targetedPosition,
      observationDate: format(obs.dateReception, 'dd/MM/yyyy'),
    }));
  }
}
