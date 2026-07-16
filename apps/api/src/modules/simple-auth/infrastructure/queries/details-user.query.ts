import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Role } from 'shared-models';

import { Prisma } from 'src/generated/prisma/client';
import { USER_DUTIES, USER_TITLES } from 'src/modules/administration/domain/user-enum';
import { PrismaService } from 'src/modules/framework/database';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class DetailsUserQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    tx?: Prisma.TransactionClient;
    userId: string;
    impersonationId: string | undefined;
  }): Promise<DetailedUserResponseDto> {
    if (!query.tx) return this.prisma.$transaction((tx) => this.handle({ ...query, tx }));

    const maybeUser = await query.tx.user.findUnique({
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
    role: z.enum(Role),
    gender: z.enum(GenderEnum),
    isImpersonated: z.boolean(),
    displayTitle: z.string().nullable(),
    duty: z.enum(USER_DUTIES).nullable(),
    title: z.enum(USER_TITLES).nullable(),
  }),
) {}
