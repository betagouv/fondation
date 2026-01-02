import { Injectable } from '@nestjs/common';
import { Magistrat } from 'shared-models';
import { UserWhereInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/modules/framework/database';
import {
  createPaginatedZodDto,
  paginate,
  Pagination,
} from 'src/modules/framework/pagination';
import { z } from 'zod';
import { formationToMemberRole, isMember, MEMBER_ROLES } from '../member.utils';

@Injectable()
export class ListMembersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    pagination: Pagination;
    formation: Magistrat.Formation | undefined;
    search: string | undefined;
  }): Promise<PaginatedMemberListItemDto> {
    const where = {
      role: { in: formationToMemberRole(query.formation) },
      OR: query.search
        ? [
            { email: { contains: query.search, mode: 'insensitive' } },
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    } satisfies UserWhereInput;

    const [totalCount, items] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        take: query.pagination.limit,
        skip: (query.pagination.page - 1) * query.pagination.limit,
        select: { id: true, role: true, firstName: true, lastName: true },
      }),
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
});

export class PaginatedMemberListItemDto extends createPaginatedZodDto(
  MemberListItemDtoSchema,
) {}
