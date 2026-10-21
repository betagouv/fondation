import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';
import { GenderEnum } from '../../../shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from '../../../shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from '../../../shared/mappers/role-enum.mapper';
import { USER_STATUSES, userStatusOf } from '../../../shared/user-status.enum';
import { AuthUser } from '../../../simple-auth/domain/auth-user';
import { AdminUserRole } from '../../domain/admin-user-role';
import { User } from '../../domain/user';
import { ADMIN_USER_ROLES_ENUM } from '../../domain/user-enum';

@Injectable()
export class DetailsUserQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { actorId: string; userId: string }): Promise<DetailedAdminUserDto> {
    const user = await this.db.tx.user.findUnique({
      select: {
        deactivatedAt: true,
        displayTitle: true,
        duty: true,
        email: true,
        firstName: true,
        gender: true,
        id: true,
        lastName: true,
        role: true,
        title: true,
      } satisfies Prisma.UserSelect,
      where: { id: query.userId },
    });
    if (!user) throw new NotFoundException();

    const role = AdminUserRole.from({
      duty: user.duty,
      role: prismaRoleEnumToRoleEnum(user.role),
      title: user.title,
    });
    const status = userStatusOf(user);
    const admin = User.from({ id: user.id, role, status });

    return {
      canDeactivate: admin.canDeactivate(query.actorId),
      canImpersonate: AuthUser.canBeImpersonated({ status }),
      canReactivate: admin.canReactivate(),
      displayTitle: user.displayTitle ?? null,
      email: user.email,
      firstName: user.firstName,
      gender: prismaGenderEnumToGenderEnum(user.gender),
      id: user.id,
      isAdmin: user.role === 'ADMIN',
      lastName: user.lastName,
      role: role.toString(),
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
