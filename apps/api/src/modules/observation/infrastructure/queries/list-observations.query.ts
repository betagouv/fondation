import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { findMagistratsCurrentPositionRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';

import { ObservationFollowUp } from '../../domain/observation-follow-up';

const ObservationFileSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const ObservationSchema = z.object({
  id: z.string(),
  dateReception: z.string(),
  description: z.string(),
  followUp: z.enum(ObservationFollowUp.enum).nullable(),
  magistrat: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      usedName: z.string().nullable(),
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

  async handle(query: { nominationFileId: string }): Promise<ListObservationsResponseDto> {
    const observations = await this.prisma.observation.findMany({
      where: { nominationFileId: query.nominationFileId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        dateReception: true,
        createdAt: true,
        description: true,
        followUp: true,
        magistrat: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            usedName: true,
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

    const magistratIds = [
      ...new Set(observations.map((obs) => obs.magistrat?.id).filter((id) => id !== undefined)),
    ];
    const positions = magistratIds.length
      ? await this.prisma.$queryRawTyped(findMagistratsCurrentPositionRawQuery(magistratIds))
      : [];
    const positionByMagistratId = new Map(positions.map((p) => [p.magistratId, p.currentPosition]));

    return {
      observations: observations.map((obs) => ({
        id: obs.id,
        dateReception: obs.dateReception.toISOString(),
        createdAt: obs.createdAt.toISOString(),
        description: obs.description,
        followUp: obs.followUp,
        magistrat: obs.magistrat
          ? {
              id: obs.magistrat.id,
              firstName: obs.magistrat.firstName,
              lastName: obs.magistrat.lastName,
              usedName: obs.magistrat.usedName,
              currentPosition: positionByMagistratId.get(obs.magistrat.id) || null,
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
