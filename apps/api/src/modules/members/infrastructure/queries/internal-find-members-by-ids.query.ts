import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { Gender, Role } from 'shared-models';

import { isMember } from '../member.utils';
import { PrismaUserDutyEnum, PrismaUserTitleEnum } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/modules/framework/database';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';

@Injectable()
export class InternalFindMembersByIdsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { ids: readonly string[] }): Promise<InternalMemberListDto[]> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: query.ids as string[] } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        role: true,
        title: true,
        displayTitle: true,
        duty: true,
      },
    });

    return users.filter(isMember).map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      gender: prismaGenderEnumToGenderEnum(u.gender),
      role: prismaRoleEnumToRoleEnum(u.role),
      title: u.title ?? null,
      displayTitle: u.displayTitle ?? null,
      duty: u.duty ?? null,
    }));
  }
}

export class InternalMemberListDto extends createZodDto(
  z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    gender: z.enum(Gender),
    role: z.enum(Role),
    title: z.enum(PrismaUserTitleEnum).nullable(),
    displayTitle: z.string().nullable(),
    duty: z.enum(PrismaUserDutyEnum).nullable(),
  }),
) {}
