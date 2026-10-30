import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { isDefined } from '../../../../utils/is-defined';
import { AdminUserRole } from '../../../administration/domain/admin-user-role';
import { User } from '../../../administration/domain/user';
import {
  servedAdminUserRole,
  ServedAdminUserRoleSchema,
} from '../../../administration/infrastructure/dto/administration.dto';
import { Db } from '../../../framework/database';
import { FormationEnum } from '../../../shared/formation.enum';
import { GenderEnum } from '../../../shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from '../../../shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from '../../../shared/mappers/role-enum.mapper';
import { RoleEnum, roleToFormation } from '../../../shared/role.enum';
import { USER_DUTIES } from '../../../shared/user-duty.enum';
import { USER_TITLES } from '../../../shared/user-title.enum';
import { AuthUser, PASSWORD_CHANGES } from '../../domain/auth-user';

@Injectable()
export class DetailsUserQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    impersonationId: string | undefined;
    userId: string;
  }): Promise<DetailedUserResponseDto> {
    const maybeUser = await this.db.tx.user.findUnique({
      select: {
        displayTitle: true,
        duty: true,
        email: true,
        firstName: true,
        gender: true,
        id: true,
        isAdmin: true,
        isTechnical: true,
        lastName: true,
        role: true,
        title: true,
      } satisfies Prisma.UserSelect,
      where: { id: query.userId },
    });

    if (!maybeUser) throw new NotFoundException();

    const { id: userId, isTechnical, ...user } = maybeUser;
    const role = prismaRoleEnumToRoleEnum(user.role);
    const gender = prismaGenderEnumToGenderEnum(user.gender);
    const isImpersonated = isDefined(query.impersonationId);
    return {
      ...user,
      canManageTechnicalAccounts: User.canManageTechnicalAccounts({ isTechnical }),
      displayedRole: servedAdminUserRole(
        AdminUserRole.from({ duty: user.duty, role, title: user.title }),
        gender,
      ),
      formation: roleToFormation(role) ?? null,
      gender,
      isImpersonated,
      passwordChange: AuthUser.passwordChangeOf({ isImpersonated }),
      role,
      userId,
    };
  }
}

export class DetailedUserResponseDto extends createZodDto(
  z.object({
    userId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    role: z.enum(RoleEnum),
    displayedRole: ServedAdminUserRoleSchema,
    /** null when the user is not restricted to a formation */
    formation: z.enum(FormationEnum).nullable(),
    gender: z.enum(GenderEnum),
    isImpersonated: z.boolean(),
    passwordChange: z.enum(PASSWORD_CHANGES),
    isAdmin: z.boolean(),
    displayTitle: z.string().nullable(),
    canManageTechnicalAccounts: z.boolean(),
    duty: z.enum(USER_DUTIES).nullable(),
    title: z.enum(USER_TITLES).nullable(),
  }),
) {}
