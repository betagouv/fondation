import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { USER_DUTIES, USER_TITLES } from 'src/modules/administration/domain/user-enum';
import { Db } from 'src/modules/framework/database';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { RoleEnum } from 'src/modules/shared/role.enum';
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
      },
    });

    if (!maybeUser) throw new NotFoundException();

    const { id: userId, ...user } = maybeUser;
    return {
      ...user,
      userId,
      isImpersonated: isDefined(query.impersonationId),
      role: prismaRoleEnumToRoleEnum(user.role),
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
    gender: z.enum(GenderEnum),
    isImpersonated: z.boolean(),
    displayTitle: z.string().nullable(),
    duty: z.enum(USER_DUTIES).nullable(),
    title: z.enum(USER_TITLES).nullable(),
  }),
) {}
