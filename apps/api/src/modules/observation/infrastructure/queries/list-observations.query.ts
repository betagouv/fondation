import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';

const ObservationFileSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const ObservationSchema = z.object({
  id: z.string(),
  dateReception: z.string(),
  description: z.string(),
  magistrat: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      usedName: z.string(),
      currentPosition: z.string().nullable(),
    })
    .nullable(),
  createdBy: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable(),
  files: z.array(ObservationFileSchema),
  createdAt: z.string(),
});

export class ObservationDto extends createZodDto(ObservationSchema) {}

export class ListObservationsResponseDto extends createZodDto(
  z.object({
    observations: z.array(ObservationSchema),
  }),
) {}

@Injectable()
export class ListObservationsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    nominationFileId: string;
  }): Promise<ListObservationsResponseDto> {
    const observations = await this.prisma.observation.findMany({
      where: { nominationFileId: query.nominationFileId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        dateReception: true,
        createdAt: true,
        description: true,
        magistrat: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            usedName: true,
            adminPosition: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

    return {
      observations: observations.map((obs) => ({
        id: obs.id,
        dateReception: obs.dateReception.toISOString(),
        createdAt: obs.createdAt.toISOString(),
        description: obs.description,
        magistrat: obs.magistrat
          ? {
              id: obs.magistrat.id,
              firstName: obs.magistrat.firstName,
              lastName: obs.magistrat.lastName,
              usedName: obs.magistrat.usedName,
              currentPosition: obs.magistrat.adminPosition,
            }
          : null,
        createdBy: obs.createdByUser,
        files: obs.files.map(({ file }) => ({
          id: file.id,
          name: file.name,
        })),
      })),
    };
  }
}
