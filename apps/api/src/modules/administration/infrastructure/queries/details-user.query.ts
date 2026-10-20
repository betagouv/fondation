import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AdminUserRole } from '../../domain/admin-user-role';
import { User } from '../../domain/user';
import { ADMIN_USER_ROLES_ENUM } from '../../domain/user-enum';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { USER_STATUSES, userStatusOf } from 'src/modules/shared/user-status.enum';

@Injectable()
export class DetailsUserQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { actorId: string; userId: string }): Promise<DetailedAdminUserDto> {
    const user = await this.db.tx.user.findUnique({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        title: true,
        duty: true,
        displayTitle: true,
        gender: true,
        deactivatedAt: true,
      } satisfies Prisma.UserSelect,
      where: { id: query.userId },
    });
    if (!user) throw new NotFoundException();

    const role = AdminUserRole.from({
      role: prismaRoleEnumToRoleEnum(user.role),
      title: user.title,
      duty: user.duty,
    });
    const status = userStatusOf(user);
    const admin = User.from({ id: user.id, role, status });

    return {
      canDeactivate: admin.canDeactivate(query.actorId),
      canImpersonate: admin.canBeImpersonated(),
      canReactivate: admin.canReactivate(),
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: prismaGenderEnumToGenderEnum(user.gender),
      isAdmin: user.role === 'ADMIN',
      role: role.toString(),
      displayTitle: user.displayTitle ?? null,
      status,
    };
  }
}

export class DetailedAdminUserDto extends createZodDto(
  z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    role: z.enum(ADMIN_USER_ROLES_ENUM),
    gender: z.enum(GenderEnum),
    displayTitle: z.string().nullable(),
    isAdmin: z.boolean(),
    status: z.enum(USER_STATUSES),
    canDeactivate: z.boolean(),
    canImpersonate: z.boolean(),
    canReactivate: z.boolean(),
  }),
) {}
