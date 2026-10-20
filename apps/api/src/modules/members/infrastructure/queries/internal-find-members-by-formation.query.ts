import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma, PrismaUserDutyEnum, PrismaUserTitleEnum } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';
import { formationToMemberRole } from '../../../shared/formation-to-member-role';
import { FormationEnum } from '../../../shared/formation.enum';
import { GenderEnum } from '../../../shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from '../../../shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum, roleEnumToPrismaRoleEnum } from '../../../shared/mappers/role-enum.mapper';
import { RoleEnum } from '../../../shared/role.enum';
import { isMember } from '../member.utils';

@Injectable()
export class InternalFindMembersByFormationQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    formation: FormationEnum;
    includeIds?: readonly string[];
  }): Promise<InternalMemberListDto[]> {
    const roles = formationToMemberRole(query.formation);
    const users = await this.db.tx.user.findMany({
      select: {
        displayTitle: true,
        duty: true,
        firstName: true,
        gender: true,
        id: true,
        lastName: true,
        role: true,
        sort: true,
        title: true,
      } satisfies Prisma.UserSelect,
      where: {
        // the members a document recorded stay offered for it, even deactivated since
        OR: [{ deactivatedAt: null }, { id: { in: [...(query.includeIds ?? [])] } }],
        role: { in: roles.map(roleEnumToPrismaRoleEnum) },
      },
    });

    return users.filter(isMember).map((u) => ({
      displayTitle: u.displayTitle ?? null,
      duty: u.duty ?? null,
      firstName: u.firstName,
      gender: prismaGenderEnumToGenderEnum(u.gender),
      id: u.id,
      lastName: u.lastName,
      role: prismaRoleEnumToRoleEnum(u.role),
      sort: u.sort,
      title: u.title ?? null,
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
