import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { Magistrat } from 'shared-models';

import { isMember, MEMBER_ROLES } from '../member.utils';
import { PrismaRoleEnum } from 'src/generated/prisma/enums';
import { listMembersRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';

@Injectable()
export class ListMembersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    pagination: Pagination;
    formations: readonly ('PARQUET' | 'SIEGE' | 'COMMUN')[] | undefined;
    search: string | undefined;
    sortBy: 'firstName' | 'lastName' | undefined;
    sortDirection: 'asc' | 'desc' | undefined;
  }): Promise<PaginatedMemberListItemDto> {
    const roles: PrismaRoleEnum[] =
      (query.formations ?? [])?.length === 0
        ? ['MEMBRE_COMMUN', 'MEMBRE_DU_SIEGE', 'MEMBRE_DU_PARQUET']
        : (query.formations ?? []).flatMap((formation) =>
            formation === 'PARQUET'
              ? ['MEMBRE_DU_PARQUET']
              : formation === 'SIEGE'
                ? ['MEMBRE_DU_SIEGE']
                : formation === 'COMMUN'
                  ? ['MEMBRE_COMMUN']
                  : [],
          );

    const [totalCount, items] = await this.prisma.$transaction([
      this.prisma.user.count({
        where: {
          role: { in: roles },
          OR: query.search
            ? [
                { email: { contains: query.search, mode: 'insensitive' } },
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
              ]
            : undefined,
        },
      }),

      this.prisma.$queryRawTyped(
        listMembersRawQuery(
          roles,
          query.search || null,
          query.sortBy || null,
          query.sortDirection || null,
          query.pagination.limit,
          (query.pagination.page - 1) * query.pagination.limit,
        ),
      ),
    ]);

    return paginate({
      totalCount,
      items: items.filter(isMember),
      pagination: query.pagination,
    });
  }
}

const MemberListItemDtoSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(MEMBER_ROLES),
  stats: z.array(
    z.object({
      year: z.number().int().gt(1),
      count: z.number().int().gte(0),
      targetedGrade: z.enum(Magistrat.Grade),
    }),
  ),
});

export class PaginatedMemberListItemDto extends createPaginatedZodDto(MemberListItemDtoSchema) {}
