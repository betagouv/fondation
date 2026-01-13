import { Injectable } from '@nestjs/common';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import {
  createPaginatedZodDto,
  paginate,
  Pagination,
} from 'src/modules/framework/pagination';

export class SearchMagistratsResponseDto extends createPaginatedZodDto(
  z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    usedName: z.string(),
    grade: z.string().nullable(),
    professionalEmail: z.string().nullable(),
  }),
) {}

@Injectable()
export class SearchMagistratsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    search: string | undefined;
    pagination: Pagination;
  }): Promise<SearchMagistratsResponseDto> {
    let searchTerm = query.search?.trim();
    searchTerm = (searchTerm?.length ?? 0) <= 2 ? undefined : searchTerm;

    const where: Prisma.MagistratWhereInput | undefined = searchTerm
      ? {
          OR: [
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { usedName: { contains: searchTerm, mode: 'insensitive' } },
            {
              professionalEmail: { contains: searchTerm, mode: 'insensitive' },
            },
          ],
        }
      : undefined;

    const [totalCount, items] = await this.prisma.$transaction([
      this.prisma.magistrat.count({ where }),
      this.prisma.magistrat.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          usedName: true,
          grade: true,
          professionalEmail: true,
        },
        take: query.pagination.limit,
        skip: (query.pagination.page - 1) * query.pagination.limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
    ]);

    return paginate({ totalCount, items, pagination: query.pagination });
  }
}
