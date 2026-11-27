import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, paginate, Pagination } from '../../../framework/pagination';
import { Sortable } from '../../../framework/sorting';
import { oldestKeptAttemptAt } from '../../domain/unrecognised-magistrat-email';
import { UNRECOGNISED_MAGISTRAT_EMAILS_SORTABLE_COLUMNS } from '../dtos/magistrat.dto';

export type UnrecognisedMagistratEmailsSortableColumn =
  (typeof UNRECOGNISED_MAGISTRAT_EMAILS_SORTABLE_COLUMNS)[number];

@Injectable()
export class ListUnrecognisedMagistratEmailsQuery {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  @Transactional()
  async handle(query: {
    pagination: Pagination;
    sorting: Sortable<UnrecognisedMagistratEmailsSortableColumn>;
  }): Promise<ListedUnrecognisedMagistratEmailsDto> {
    const where = {
      lastAttemptAt: { gte: oldestKeptAttemptAt(this.clock.now()) },
    } satisfies Prisma.UnrecognisedMagistratEmailWhereInput;
    const totalCount = await this.db.tx.unrecognisedMagistratEmail.count({ where });
    const rows = await this.db.tx.unrecognisedMagistratEmail.findMany({
      orderBy: [
        query.sorting.sortBy
          ? { [query.sorting.sortBy]: query.sorting.sortDesc ? 'desc' : 'asc' }
          : { lastAttemptAt: 'desc' },
        { id: 'asc' },
      ],
      select: {
        email: true,
        id: true,
        lastAttemptAt: true,
      } satisfies Prisma.UnrecognisedMagistratEmailSelect,
      skip: (query.pagination.page - 1) * query.pagination.limit,
      take: query.pagination.limit,
      where,
    });

    return paginate({
      items: rows.map((row) => ({ ...row, lastAttemptAt: row.lastAttemptAt.toISOString() })),
      pagination: query.pagination,
      totalCount,
    });
  }
}

export class ListedUnrecognisedMagistratEmailsDto extends createPaginatedZodDto(
  z.object({
    email: z.string(),
    id: z.uuid(),
    lastAttemptAt: z.iso.datetime(),
  }),
) {}
