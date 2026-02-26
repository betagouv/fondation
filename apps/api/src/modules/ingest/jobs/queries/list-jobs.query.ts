import { Injectable } from '@nestjs/common';
import { PrismaJobStatusEnum } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/modules/framework/database';
import {
  createPaginatedZodDto,
  paginate,
  Pagination,
} from 'src/modules/framework/pagination';
import z from 'zod';

@Injectable()
export class ListJobsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    pagination: Pagination;
    statuses: ('SUCCEEDED' | 'FAILED' | 'RUNNING' | 'IDLE' | 'CANCELED')[];
  }): Promise<PaginatedJobsDto> {
    const [totalCount, items] = await this.prisma.$transaction([
      this.prisma.ingestionJob.count({
        where: {
          status:
            query.statuses.length > 0 ? { in: query.statuses } : undefined,
        },
      }),
      this.prisma.ingestionJob.findMany({
        orderBy: { id: 'desc' },
        where: {
          status:
            query.statuses.length > 0 ? { in: query.statuses } : undefined,
        },
        take: query.pagination.limit,
        skip: (query.pagination.page - 1) * query.pagination.limit,
        select: {
          id: true,
          status: true,
          createdAt: true,
          startedAt: true,
          endedAt: true,
          errors: { select: { error: true } },
        },
      }),
    ]);

    return paginate({
      totalCount,
      pagination: query.pagination,
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        startedAt: item.startedAt?.toISOString(),
        endedAt: item.endedAt?.toISOString(),
      })),
    });
  }
}

export class PaginatedJobsDto extends createPaginatedZodDto(
  z.object({
    id: z.number(),
    status: z.enum(PrismaJobStatusEnum),
    createdAt: z.iso.datetime(),
    startedAt: z.iso.datetime().nullable(),
    endedAt: z.iso.datetime().nullable(),
    errors: z.array(z.object({ error: z.string() })),
  }),
) {}
