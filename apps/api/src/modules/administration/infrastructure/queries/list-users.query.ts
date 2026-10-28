import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { assertIsDefined } from '../../../../utils/is-defined';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, paginate, Pagination } from '../../../framework/pagination';
import { Sortable } from '../../../framework/sorting';
import { ADMIN_USER_ROLES_ENUM, AdminUserRoleEnum } from '../../../shared/admin-user-role.enum';
import { GenderEnum } from '../../../shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from '../../../shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from '../../../shared/mappers/role-enum.mapper';
import { USER_STATUSES, UserStatus, userStatusOf } from '../../../shared/user-status.enum';
import { AdminUserRole } from '../../domain/admin-user-role';
import {
  adminUserRoleEnumToDuty,
  adminUserRoleEnumToIdentityRoles,
  adminUserRoleEnumToTitle,
} from '../../domain/user-enum';
import { ListUsersQueryDto } from '../dto/administration.dto';

@Injectable()
export class ListUsersQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    search?: string;
    roles?: AdminUserRoleEnum[];
    statuses?: UserStatus[];
    sorting: Sortable<ListUsersQueryDto>;
    pagination: Pagination;
  }): Promise<PaginatedAdminUserListItemDto> {
    const roles: Prisma.UserWhereInput[] | undefined = query.roles?.map((role) => {
      const idRoles = adminUserRoleEnumToIdentityRoles(role);
      return {
        duty: adminUserRoleEnumToDuty(role),
        OR: idRoles.length > 1 ? idRoles.map((role) => ({ role })) : undefined,
        role: idRoles.length === 1 ? idRoles[0] : undefined,
        title: adminUserRoleEnumToTitle(role),
      } satisfies Prisma.UserWhereInput;
    });

    const whereRole: Prisma.UserWhereInput = roles
      ? roles.length === 1
        ? assertIsDefined(roles[0], 'no role condition available')
        : { OR: roles }
      : {};

    const statuses = new Set(query.statuses);
    const whereStatus: Prisma.UserWhereInput =
      statuses.size === 1 ? { deactivatedAt: statuses.has('ACTIVE') ? null : { not: null } } : {};

    const where: Prisma.UserWhereInput = {
      AND: [
        whereRole,
        whereStatus,
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
    const totalCount = await this.db.tx.user.count({ where });
    const items = await this.db.tx.user.findMany({
      orderBy: [{ lastName: direction }, { createdAt: 'asc' }],
      select: {
        deactivatedAt: true,
        duty: true,
        email: true,
        firstName: true,
        gender: true,
        id: true,
        isAdmin: true,
        lastName: true,
        role: true,
        title: true,
      } satisfies Prisma.UserSelect,
      skip: (query.pagination.page - 1) * query.pagination.limit,
      take: query.pagination.limit,
      where,
    });

    return paginate({
      items: items.map(({ deactivatedAt, duty, gender, role, title, ...u }) => ({
        ...u,
        gender: prismaGenderEnumToGenderEnum(gender),
        role: AdminUserRole.from({
          duty: duty ?? null,
          role: prismaRoleEnumToRoleEnum(role),
          title: title ?? null,
        }).toString(),
        status: userStatusOf({ deactivatedAt }),
      })),
      pagination: query.pagination,
      totalCount,
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
    isAdmin: z.boolean(),
    status: z.enum(USER_STATUSES),
  }),
) {}
