import { Injectable } from '@nestjs/common';
import z from 'zod';

import {
  searchMagistratRawQuery,
  searchMagistratTotalCountRawQuery,
} from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import {
  createPaginatedZodDto,
  paginate,
  Pagination,
} from 'src/modules/framework/pagination';
import { toMagistratFullTextQuery } from 'src/utils/fulltext-search';

@Injectable()
export class SearchMagistratsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    search: string | undefined;
    ignoreIds: readonly string[] | undefined;
    pagination: Pagination;
  }): Promise<SearchMagistratsResponseDto> {
    const searchQuery = query.search?.trim()
      ? toMagistratFullTextQuery(query.search)
      : null;

    const ignoreIds: string[] | null =
      query.ignoreIds && query.ignoreIds.length > 0
        ? (query.ignoreIds as string[])
        : null;

    const [[resultTotal], resultItems] = await this.prisma.$transaction([
      this.prisma.$queryRawTyped(
        searchMagistratTotalCountRawQuery(searchQuery, ignoreIds),
      ),
      this.prisma.$queryRawTyped(
        searchMagistratRawQuery(
          searchQuery,
          ignoreIds,
          (query.pagination.page - 1) * query.pagination.limit,
          query.pagination.limit,
        ),
      ),
    ]);

    const items = resultItems.map(
      ({ id, grade, firstName, lastName, usedName, ...item }) => ({
        id,
        grade,
        firstName,
        lastName,
        usedName,
        currentPosition:
          item.functionId && item.jurisdictionId
            ? `${item.functionId} ${item.jurisdictionId}`
            : item.currentPosition,
      }),
    );

    return paginate({
      items,
      pagination: query.pagination,
      totalCount: Number(resultTotal?.count ?? 0),
    });
  }
}

export class SearchMagistratsResponseDto extends createPaginatedZodDto(
  z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    usedName: z.string(),
    grade: z.string().nullable(),
    currentPosition: z.string().nullable(),
  }),
) {}
