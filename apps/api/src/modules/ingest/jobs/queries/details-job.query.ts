import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaJobStatusEnum } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class DetailsJobQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { jobId: number }): Promise<DetailedJobDto> {
    const job = await this.prisma.ingestionJob.findUnique({
      where: { id: query.jobId },
      select: {
        id: true,
        createdAt: true,
        startedAt: true,
        endedAt: true,
        status: true,
        errors: { select: { error: true }, orderBy: { id: 'asc' } },
        files: {
          select: {
            fileId: true,
            fileSha256: true,
            status: true,
            startedAt: true,
            endedAt: true,
            file: { select: { name: true } },
            requirements: { select: { requiredFileId: true } },
            errors: {
              orderBy: { id: 'asc' },
              select: {
                entityId: true,
                entityNumber: true,
                error: true,
              },
            },
          },
        },
      },
    });

    if (!job) throw new NotFoundException();

    return {
      ...job,
      createdAt: job.createdAt.toISOString() ?? null,
      startedAt: job.startedAt?.toISOString() ?? null,
      endedAt: job.endedAt?.toISOString() ?? null,
      files: job.files.map(({ fileId, file: storedFile, ...file }) => ({
        ...file,
        id: fileId,
        name: storedFile.name,
        startedAt: file.startedAt?.toISOString() ?? null,
        endedAt: file.endedAt?.toISOString() ?? null,
      })),
    };
  }
}

export class DetailedJobDto extends createZodDto(
  z.object({
    id: z.number(),
    createdAt: z.iso.datetime(),
    startedAt: z.iso.datetime().nullable(),
    endedAt: z.iso.datetime().nullable(),
    status: z.enum(PrismaJobStatusEnum),
    errors: z.array(z.object({ error: z.string() })),
    files: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        fileSha256: z.string(),
        status: z.enum(PrismaJobStatusEnum),
        startedAt: z.iso.datetime().nullable(),
        endedAt: z.iso.datetime().nullable(),
        requirements: z.array(z.object({ requiredFileId: z.string() })),
        errors: z.array(
          z.object({
            entityId: z.string().nullable(),
            entityNumber: z.number().nullable(),
            error: z.string(),
          }),
        ),
      }),
    ),
  }),
) {}
