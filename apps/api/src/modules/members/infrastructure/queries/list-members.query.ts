import { Injectable } from '@nestjs/common';
import { Magistrat } from 'shared-models';
import { z } from 'zod';

import { listMembersRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import {
  createPaginatedZodDto,
  paginate,
  Pagination,
} from 'src/modules/framework/pagination';
import { formationToMemberRole, isMember, MEMBER_ROLES } from '../member.utils';

@Injectable()
export class ListMembersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    pagination: Pagination;
    formation: Magistrat.Formation | undefined;
    search: string | undefined;
  }): Promise<PaginatedMemberListItemDto> {
    const roles = formationToMemberRole(query.formation);

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

export class PaginatedMemberListItemDto extends createPaginatedZodDto(
  MemberListItemDtoSchema,
) {}
