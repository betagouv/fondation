import { Injectable } from '@nestjs/common';
import z from 'zod';

import { AdminUserRole } from '../../domain/admin-user-role';
import {
  ADMIN_USER_ROLES_ENUM,
  AdminUserRoleEnum,
  adminUserRoleEnumToDuty,
  adminUserRoleEnumToIdentityRoles,
  adminUserRoleEnumToTitle,
} from '../../domain/user-enum';
import { ListUsersQueryDto } from '../dto/administration.dto';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { assertIsDefined } from 'src/utils/is-defined';

@Injectable()
export class ListUsersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    search?: string;
    roles?: AdminUserRoleEnum[];
    sorting: Sortable<ListUsersQueryDto>;
    pagination: Pagination;
  }): Promise<PaginatedAdminUserListItemDto> {
    const roles: Prisma.UserWhereInput[] | undefined = query.roles?.map((role) => {
      const idRoles = adminUserRoleEnumToIdentityRoles(role);
      return {
        title: adminUserRoleEnumToTitle(role),
        duty: adminUserRoleEnumToDuty(role),

        role: idRoles.length === 1 ? idRoles[0] : undefined,
        OR: idRoles.length > 1 ? idRoles.map((role) => ({ role })) : undefined,
      } satisfies Prisma.UserWhereInput;
    });

    const whereRole: Prisma.UserWhereInput = roles
      ? roles.length === 1
        ? assertIsDefined(roles[0], 'no role condition available')
        : { OR: roles }
      : {};

    const where: Prisma.UserWhereInput = {
      AND: [
        whereRole,
        {
          OR: query.search
            ? [
                { email: { contains: query.search, mode: 'insensitive' as const } },
                { firstName: { contains: query.search, mode: 'insensitive' as const } },
                { lastName: { contains: query.search, mode: 'insensitive' as const } },
              ]
            : undefined,
        },
      ],
    };

    const direction = query.sorting.sortDesc ? 'desc' : 'asc';
    const [totalCount, items] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          title: true,
          duty: true,
          gender: true,
        },
        where,
        orderBy: [{ lastName: direction }, { createdAt: 'asc' }],
        skip: (query.pagination.page - 1) * query.pagination.limit,
        take: query.pagination.limit,
      }),
    ]);

    return paginate({
      totalCount,
      items: items.map(({ role, title, duty, gender, ...u }) => ({
        ...u,
        gender: prismaGenderEnumToGenderEnum(gender),
        role: AdminUserRole.from({
          role: prismaRoleEnumToRoleEnum(role),
          title: title ?? null,
          duty: duty ?? null,
        }).toString(),
      })),
      pagination: query.pagination,
    });
  }
}

export class PaginatedAdminUserListItemDto extends createPaginatedZodDto(
  z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    gender: z.enum(GenderEnum),
    role: z.enum(ADMIN_USER_ROLES_ENUM),
  }),
) {}
