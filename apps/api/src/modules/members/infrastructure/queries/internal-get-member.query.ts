import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Gender, Role } from 'shared-models';

import { isMember, MEMBER_ROLES } from '../member.utils';
import { PrismaUserDutyEnum, PrismaUserTitleEnum } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/modules/framework/database';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';

@Injectable()
export class InternalGetMemberQuery {
  constructor(private prisma: PrismaService) {}

  async handle(query: { id: string }): Promise<InternalMemberDto> {
    const member = await this.prisma.user.findUnique({
      where: { id: query.id, role: { in: MEMBER_ROLES } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        role: true,
        displayTitle: true,
        title: true,
        duty: true,
      },
    });

    if (!member || !isMember(member)) throw new NotFoundException();

    return {
      ...member,
      role: prismaRoleEnumToRoleEnum(member.role),
      gender: prismaGenderEnumToGenderEnum(member.gender),
      duty: member.duty ?? null,
    };
  }
}

export class InternalMemberDto extends createZodDto(
  z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    gender: z.enum(Gender),
    role: z.enum(Role),
    displayTitle: z.string().nullable(),
    title: z.enum(PrismaUserTitleEnum).nullable(),
    duty: z.enum(PrismaUserDutyEnum).nullable(),
  }),
) {}
