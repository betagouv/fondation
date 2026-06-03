import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Gender, Magistrat, Role } from 'shared-models';

import { isMember } from '../member.utils';
import { Prisma, PrismaUserDutyEnum, PrismaUserTitleEnum } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { formationToMemberRole } from 'src/modules/shared/formation-to-member-role';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import {
  prismaRoleEnumToRoleEnum,
  roleEnumToPrismaRoleEnum,
} from 'src/modules/shared/mappers/role-enum.mapper';

@Injectable()
export class InternalFindMembersByFormationQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    formation: Magistrat.Formation;
    tx?: Prisma.TransactionClient;
  }): Promise<InternalMemberListDto[]> {
    if (!query.tx) return this.prisma.$transaction((tx) => this.handle({ ...query, tx }));

    const roles = formationToMemberRole(query.formation);
    const users = await query.tx.user.findMany({
      where: { role: { in: roles.map(roleEnumToPrismaRoleEnum) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        role: true,
        title: true,
        displayTitle: true,
        duty: true,
        sort: true,
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
      sort: u.sort,
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
    sort: z.number(),
  }),
) {}
