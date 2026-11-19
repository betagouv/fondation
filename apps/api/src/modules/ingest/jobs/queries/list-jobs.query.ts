import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { PrismaJobStatusEnum } from '../../../../generated/prisma/enums';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, paginate, Pagination } from '../../../framework/pagination';

@Injectable()
export class ListJobsQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    pagination: Pagination;
    statuses: ('SUCCEEDED' | 'FAILED' | 'RUNNING' | 'IDLE' | 'CANCELED')[];
  }): Promise<PaginatedJobsDto> {
    const totalCount = await this.db.tx.ingestionJob.count({
      where: {
        status: query.statuses.length > 0 ? { in: query.statuses } : undefined,
      },
    });
    const items = await this.db.tx.ingestionJob.findMany({
      orderBy: { id: 'desc' },
      select: {
        createdAt: true,
        endedAt: true,
        id: true,
        startedAt: true,
        status: true,
      } satisfies Prisma.IngestionJobSelect,
      skip: (query.pagination.page - 1) * query.pagination.limit,
      take: query.pagination.limit,
      where: {
        status: query.statuses.length > 0 ? { in: query.statuses } : undefined,
      },
    });

    return paginate({
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        endedAt: item.endedAt?.toISOString() ?? null,
        startedAt: item.startedAt?.toISOString() ?? null,
      })),
      pagination: query.pagination,
      totalCount,
    });
  }
}

export class PaginatedJobsDto extends createPaginatedZodDto(
  z.object({
    createdAt: z.iso.datetime(),
    endedAt: z.iso.datetime().nullable(),
    id: z.number(),
    startedAt: z.iso.datetime().nullable(),
    status: z.enum(PrismaJobStatusEnum),
  }),
) {}
