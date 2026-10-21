import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { PrismaUserDutyEnum, PrismaUserTitleEnum } from '../../../../generated/prisma/enums';
import { Db } from '../../../framework/database';
import { GenderEnum } from '../../../shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from '../../../shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from '../../../shared/mappers/role-enum.mapper';
import { RoleEnum } from '../../../shared/role.enum';
import { isMember, MEMBER_ROLES } from '../member.utils';

@Injectable()
export class InternalGetMemberQuery {
  constructor(private db: Db) {}

  @Transactional()
  async handle(query: { id: string }): Promise<InternalMemberDto> {
    const member = await this.db.tx.user.findUnique({
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
        sort: true,
      } satisfies Prisma.UserSelect,
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
    gender: z.enum(GenderEnum),
    role: z.enum(RoleEnum),
    displayTitle: z.string().nullable(),
    title: z.enum(PrismaUserTitleEnum).nullable(),
    duty: z.enum(PrismaUserDutyEnum).nullable(),
    sort: z.number(),
  }),
) {}
