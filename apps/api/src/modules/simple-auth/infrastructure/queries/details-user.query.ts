import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Gender, Role } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';

@Injectable()
export class DetailsUserQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { userId: string }): Promise<DetailedUserResponseDto> {
    const maybeUser = await this.prisma.user.findUnique({
      where: { id: query.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        gender: true,
      },
    });

    if (!maybeUser) throw new NotFoundException();

    const { id: userId, ...user } = maybeUser;
    return {
      ...user,
      userId,
      role: prismaRoleEnumToRoleEnum(user.role),
      gender: prismaGenderEnumToGenderEnum(user.gender),
    };
  }
}

export const DetailedUserResponseDtoSchema = z.object({
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(Role),
  gender: z.enum(Gender),
});

export class DetailedUserResponseDto extends createZodDto(
  DetailedUserResponseDtoSchema,
) {}
