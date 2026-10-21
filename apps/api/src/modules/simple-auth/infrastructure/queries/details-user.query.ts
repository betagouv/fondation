import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { roleToFormation } from 'src/modules/members/infrastructure/member.utils';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { RoleEnum } from 'src/modules/shared/role.enum';
import { USER_DUTIES } from 'src/modules/shared/user-duty.enum';
import { USER_TITLES } from 'src/modules/shared/user-title.enum';
import { isDefined } from 'src/utils/is-defined';

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
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        gender: true,
        duty: true,
        title: true,
        displayTitle: true,
      } satisfies Prisma.UserSelect,
    });

    if (!maybeUser) throw new NotFoundException();

    const { id: userId, ...user } = maybeUser;
    const role = prismaRoleEnumToRoleEnum(user.role);
    return {
      ...user,
      userId,
      isImpersonated: isDefined(query.impersonationId),
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
    role: z.enum(RoleEnum),
    /** null when the user is not restricted to a formation */
    formation: z.enum(FormationEnum).nullable(),
    gender: z.enum(GenderEnum),
    isImpersonated: z.boolean(),
    displayTitle: z.string().nullable(),
    duty: z.enum(USER_DUTIES).nullable(),
    title: z.enum(USER_TITLES).nullable(),
  }),
) {}
