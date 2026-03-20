import { Injectable } from '@nestjs/common';
import { Role } from 'shared-models';
import z from 'zod';
import { PrismaService } from 'src/modules/framework/database';
import {
  createPaginatedZodDto,
  paginate,
  Pagination,
} from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { USER_TITLES } from '../../domain/user';
import { ListUsersQueryDto } from '../dto/administration.dto';

@Injectable()
export class ListUsersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    search?: string;
    sorting: Sortable<ListUsersQueryDto>;
    pagination: Pagination;
  }): Promise<PaginatedAdminUserListItemDto> {
    const where = query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' as const } },
            { firstName: { contains: query.search, mode: 'insensitive' as const } },
            { lastName: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const direction = query.sorting.sortDesc ? 'desc' : 'asc';
    const orderBy = (() => {
      switch (query.sorting.sortBy) {
        case 'firstName':
          return { firstName: direction } as const;
        case 'email':
          return { email: direction } as const;
        default:
        case 'lastName':
          return { lastName: direction } as const;
      }
    })();

    const [totalCount, items] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        select: { id: true, firstName: true, lastName: true, email: true, role: true, title: true },
        where,
        orderBy,
        skip: (query.pagination.page - 1) * query.pagination.limit,
        take: query.pagination.limit,
      }),
    ]);

    return paginate({
      totalCount,
      items: items.map((u) => ({
        ...u,
        title: u.title ?? null,
        role: prismaRoleEnumToRoleEnum(u.role),
      })),
      pagination: query.pagination,
    });
  }
}

const AdminUserListItemSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: z.enum(Role),
  title: z.enum(USER_TITLES).nullable(),
});

export class PaginatedAdminUserListItemDto extends createPaginatedZodDto(AdminUserListItemSchema) {}
