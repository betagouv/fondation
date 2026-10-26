import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { assertIsDefined } from '../../../../utils/is-defined';
import { fullname } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';
import { GenderEnum } from '../../../shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from '../../../shared/mappers/gender-enum.mapper';
import { prismaRoleEnumToRoleEnum } from '../../../shared/mappers/role-enum.mapper';
import { USER_TITLES } from '../../../shared/user-title.enum';
import { AdminUserRole } from '../../domain/admin-user-role';
import { ADMIN_USER_ROLES_ENUM } from '../../domain/user-enum';

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
        const title = assertIsDefined(holder.title);
        const role = AdminUserRole.from({
          duty: holder.duty,
          role: prismaRoleEnumToRoleEnum(holder.role),
          title,
        });

        return {
          holder: {
            gender: prismaGenderEnumToGenderEnum(holder.gender),
            id: holder.id,
            name: fullname(holder),
            nextRole: role.untitled().toString(),
          },
          title,
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
          // TODO: see FON-699, which serves the role labels agreed to the gender
          gender: z.enum(GenderEnum),
          id: z.string(),
          name: z.string(),
          nextRole: z.enum(ADMIN_USER_ROLES_ENUM),
        }),
        title: z.enum(USER_TITLES),
      }),
    ),
  }),
) {}
