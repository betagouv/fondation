import { Injectable } from '@nestjs/common';
import { and, asc, desc, ilike, inArray, or } from 'drizzle-orm';
import { Db } from 'src/modules/framework/drizzle';
import { users } from 'src/modules/framework/drizzle/schemas';
import {
  paginate,
  Paginated,
  Pagination,
} from 'src/modules/framework/pagination';
import { z } from 'zod';
import type { MemberSortField } from '../member.dto';
import { isMember, MEMBER_ROLES } from '../member.utils';

@Injectable()
export class ListMembersQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    pagination: Pagination;
    search: string | undefined;
    sort: { field: MemberSortField | undefined; direction: 'asc' | 'desc' };
  }): Promise<Paginated<MemberListItemDto>> {
    const [totalCount, items] = await this.db.transaction(async (tx) => {
      const where = and(
        inArray(users.role, MEMBER_ROLES),
        query.search
          ? or(
              ilike(users.email, `%${query.search}%`),
              ilike(users.firstName, `%${query.search}%`),
              ilike(users.lastName, `%${query.search}%`),
            )
          : undefined,
      );
      const totalCount = await tx.$count(users, where);

      const sortFn = query.sort.direction === 'desc' ? desc : asc;
      const sortColumn = query.sort.field
        ? users[query.sort.field]
        : users.lastName;

      const memberItems = await tx.query.users.findMany({
        where,
        orderBy: sortFn(sortColumn),
        limit: query.pagination.limit,
        offset: (query.pagination.page - 1) * query.pagination.limit,
        columns: {
          id: true,
          role: true,
          firstName: true,
          lastName: true,
        },
      });

      return [totalCount, memberItems.filter(isMember)] as const;
    });

    return paginate({ items, totalCount, pagination: query.pagination });
  }
}

export const MemberListItemDtoSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(MEMBER_ROLES),
});
export type MemberListItemDto = z.infer<typeof MemberListItemDtoSchema>;
