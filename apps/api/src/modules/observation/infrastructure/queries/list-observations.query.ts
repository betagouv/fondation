import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';

const ObservationFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  signedUrl: z.string().nullable(),
});

const ObservationSchema = z.object({
  id: z.string(),
  dateReception: z.string(),
  magistrat: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      usedName: z.string(),
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

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

    const allFileIds = observations.flatMap((obs) =>
      obs.files.map(({ file }) => file.id),
    );

    const fileUrls =
      allFileIds.length > 0 ? await this.files.getPublicUrls(allFileIds) : {};

    return {
      observations: observations.map((obs) => ({
        id: obs.id,
        dateReception: obs.dateReception.toISOString(),
        createdAt: obs.createdAt.toISOString(),
        magistrat: obs.magistrat,
        createdBy: obs.createdByUser,
        files: obs.files.map(({ file }) => ({
          id: file.id,
          name: file.name,
          signedUrl: fileUrls[file.id]?.toString() ?? null,
        })),
      })),
    };
  }
}
