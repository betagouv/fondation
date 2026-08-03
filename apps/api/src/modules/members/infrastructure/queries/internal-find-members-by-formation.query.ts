import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { isMember } from '../member.utils';
import { PrismaUserDutyEnum, PrismaUserTitleEnum } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { formationToMemberRole } from 'src/modules/shared/formation-to-member-role';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import {
  prismaRoleEnumToRoleEnum,
  roleEnumToPrismaRoleEnum,
} from 'src/modules/shared/mappers/role-enum.mapper';
import { RoleEnum } from 'src/modules/shared/role.enum';

@Injectable()
export class InternalFindMembersByFormationQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: { formation: FormationEnum }): Promise<InternalMemberListDto[]> {
    const roles = formationToMemberRole(query.formation);
    const users = await this.db.tx.user.findMany({
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
    gender: z.enum(GenderEnum),
    role: z.enum(RoleEnum),
    title: z.enum(PrismaUserTitleEnum).nullable(),
    displayTitle: z.string().nullable(),
    duty: z.enum(PrismaUserDutyEnum).nullable(),
    sort: z.number(),
  }),
) {}
