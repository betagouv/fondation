import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Gender, Role } from 'shared-models';

import {
  PrismaUserDutyEnum,
  PrismaUserTitleEnum,
} from 'src/generated/prisma/enums';
import { PrismaService } from 'src/modules/framework/database';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class DetailsUserQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    userId: string;
    impersonationId: string | undefined;
  }): Promise<DetailedUserResponseDto> {
    const maybeUser = await this.prisma.user.findUnique({
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
    gender: z.enum(Gender),
    isImpersonated: z.boolean(),
    displayTitle: z.string().nullable(),
    duty: z.enum(PrismaUserDutyEnum).nullable(),
    title: z.enum(PrismaUserTitleEnum).nullable(),
  }),
) {}
