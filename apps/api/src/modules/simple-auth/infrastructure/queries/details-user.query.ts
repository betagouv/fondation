import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { isDefined } from '../../../../utils/is-defined';
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
    userId: string;
    impersonationId: string | undefined;
  }): Promise<DetailedUserResponseDto> {
    const maybeUser = await this.db.tx.user.findUnique({
      where: { id: query.userId },
      select: {
        displayTitle: true,
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
    });

    if (!maybeUser) throw new NotFoundException();

    const { id: userId, ...user } = maybeUser;
    const role = prismaRoleEnumToRoleEnum(user.role);
    const isImpersonated = isDefined(query.impersonationId);
    return {
      ...user,
      userId,
      isImpersonated,
      passwordChange: AuthUser.passwordChangeOf({ isImpersonated }),
      role,
      formation: roleToFormation(role) ?? null,
      gender: prismaGenderEnumToGenderEnum(user.gender),
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
    /** null when the user is not restricted to a formation */
    formation: z.enum(FormationEnum).nullable(),
    gender: z.enum(GenderEnum),
    isImpersonated: z.boolean(),
    passwordChange: z.enum(PASSWORD_CHANGES),
    isAdmin: z.boolean(),
    displayTitle: z.string().nullable(),
    duty: z.enum(USER_DUTIES).nullable(),
    title: z.enum(USER_TITLES).nullable(),
  }),
) {}
