import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { format } from 'date-fns';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';

const ObservationFileSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const ObservationDetailsSchema = z.object({
  id: z.string(),
  dateReception: z.string().describe('Date de réception au format JJ/MM/AAAA'),
  observant: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    usedName: z.string(),
  }),
  magistratObserve: z.object({
    nom: z.string(),
    postePropose: z.string().nullable(),
  }),
  files: z.array(ObservationFileSchema),
});

export class GetObservationDetailsResponseDto extends createZodDto(
  ObservationDetailsSchema,
) {}

@Injectable()
export class GetObservationDetailsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
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

    return {
      id: observation.id,
      dateReception: format(observation.dateReception, 'dd/MM/yyyy'),
      observant: {
        id: observation.magistrat.id,
        firstName: observation.magistrat.firstName,
        lastName: observation.magistrat.lastName,
        usedName: observation.magistrat.usedName,
      },
      magistratObserve: {
        nom: observation.nominationFile.name,
        postePropose: observation.nominationFile.targetedPosition,
      },
      files: observation.files.map(({ file }) => ({
        id: file.id,
        name: file.name,
      })),
    };
  }
}
