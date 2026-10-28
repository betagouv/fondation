import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { assertIsDefined } from '../../../../utils/is-defined';
import { fullname } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';
import { ADMIN_USER_ROLES_ENUM, adminUserRoleLabel } from '../../../shared/admin-user-role.enum';
import { prismaGenderEnumToGenderEnum } from '../../../shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from '../../../shared/mappers/role-enum.mapper';
import { AdminUserRole } from '../../domain/admin-user-role';

@Injectable()
export class ListTitleHoldersQuery {
  constructor(private readonly db: Db) {}

  async handle(): Promise<ListedTitleHoldersDto> {
    const holders = await this.db.tx.user.findMany({
      select: {
        duty: true,
        firstName: true,
        gender: true,
        id: true,
        lastName: true,
        role: true,
        title: true,
      } satisfies Prisma.UserSelect,
      where: { title: { not: null } },
    });

    return {
      items: holders.map((holder) => {
        const role = AdminUserRole.from({
          duty: holder.duty,
          role: prismaRoleEnumToRoleEnum(holder.role),
          title: assertIsDefined(holder.title),
        });

        const gender = prismaGenderEnumToGenderEnum(holder.gender);
        const nextRole = role.untitled().toString();

        return {
          holder: {
            id: holder.id,
            name: fullname(holder),
            nextRole: { id: nextRole, label: adminUserRoleLabel(nextRole, gender) },
          },
          role: { id: role.toString(), label: adminUserRoleLabel(role.toString(), gender) },
        };
      }),
    };
  }
}

export class ListedTitleHoldersDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        holder: z.object({
          id: z.string(),
          name: z.string(),
          nextRole: z.object({ id: z.enum(ADMIN_USER_ROLES_ENUM), label: z.string() }),
        }),
        role: z.object({ id: z.enum(ADMIN_USER_ROLES_ENUM), label: z.string() }),
      }),
    ),
  }),
) {}
