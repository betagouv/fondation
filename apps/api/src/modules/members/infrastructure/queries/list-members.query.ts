import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { PrismaRoleEnum } from '../../../../generated/prisma/enums';
import { listMembersRawQuery } from '../../../../generated/prisma/sql';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, paginate, Pagination } from '../../../framework/pagination';
import { USER_STATUSES, UserStatus, userStatusOf } from '../../../shared/user-status.enum';
import { isMember, MEMBER_ROLES } from '../member.utils';

@Injectable()
export class ListMembersQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    pagination: Pagination;
    formations: readonly ('PARQUET' | 'SIEGE' | 'COMMUN')[] | undefined;
    search: string | undefined;
    sortBy: 'firstName' | 'lastName' | undefined;
    sortDirection: 'asc' | 'desc' | undefined;
    statuses: readonly UserStatus[];
  }): Promise<PaginatedMemberListItemDto> {
    const includesActive = query.statuses.includes('ACTIVE');
    const includesDeactivated = query.statuses.includes('DEACTIVATED');

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

    const totalCount = await this.db.tx.user.count({
      where: {
        deactivatedAt:
          includesActive === includesDeactivated ? undefined : includesActive ? null : { not: null },
        OR: query.search
          ? [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
        role: { in: roles },
      },
    });

    const items = await this.db.tx.$queryRawTyped(
      listMembersRawQuery(
        roles,
        query.search || null,
        query.sortBy || null,
        query.sortDirection || null,
        query.pagination.limit,
        (query.pagination.page - 1) * query.pagination.limit,
        includesActive,
        includesDeactivated,
      ),
    );

    return paginate({
      items: items.filter(isMember).map(({ deactivatedAt, ...member }) => ({
        ...member,
        status: userStatusOf({ deactivatedAt }),
      })),
      pagination: query.pagination,
      totalCount,
    });
  }
}

const MemberListItemDtoSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(MEMBER_ROLES),
  excludedJurisdictions: z.array(z.object({ id: z.string(), label: z.string().nullable() })),
  status: z.enum(USER_STATUSES),
});

export class PaginatedMemberListItemDto extends createPaginatedZodDto(MemberListItemDtoSchema) {}
