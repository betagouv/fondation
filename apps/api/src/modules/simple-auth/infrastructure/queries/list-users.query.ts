import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaRoleEnum } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import {
  prismaRoleEnumToRoleEnum,
  roleEnumToPrismaRoleEnum,
} from 'src/modules/shared/mappers/role-enum.mapper';
import { RoleEnum } from 'src/modules/shared/role.enum';

@Injectable()
export class ListUsersQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    search?: string;
    roles?: readonly RoleEnum[];
    excludeIds?: readonly string[];
    includeIds?: readonly string[];
    includeIdsOnly?: true;
    limit?: number;
  }): Promise<ListedUsersDto> {
    let excludeIds = new Set(query.excludeIds);
    const includeIds = new Set(query.includeIds).difference(excludeIds);
    excludeIds = excludeIds.union(includeIds);

    const items = await this.db.withTransaction(async () => {
      const union: {
        id: string;
        role: PrismaRoleEnum;
        firstName: string;
        lastName: string;
      }[] = [];

      if (includeIds.size) {
        const nextItems = await this.db.tx.user.findMany({
          select: { id: true, firstName: true, lastName: true, role: true },
          where: { id: { in: [...includeIds] } },
          orderBy: { lastName: 'asc' },
        });
        union.push(...nextItems);
      }

      if (!(includeIds.size > 0 && query.includeIdsOnly)) {
        const nextItems = await this.db.tx.user.findMany({
          select: { id: true, role: true, firstName: true, lastName: true },
          orderBy: { lastName: 'asc' },
          take: query.limit ? query.limit - union.length : undefined,
          where: {
            id: { notIn: [...excludeIds] },
            role: query.roles ? { in: query.roles.map(roleEnumToPrismaRoleEnum) } : undefined,
            OR:
              query.search && query.search.length > 2
                ? [
                    { email: { contains: query.search, mode: 'insensitive' } },
                    {
                      firstName: {
                        contains: query.search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      lastName: { contains: query.search, mode: 'insensitive' },
                    },
                  ]
                : undefined,
          },
        });
        union.push(...nextItems);
      }

      return union;
    });

    return {
      items: items.map((user) => ({
        ...user,
        role: prismaRoleEnumToRoleEnum(user.role),
      })),
    };
  }
}

export class ListedUsersDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        role: z.enum(RoleEnum),
      }),
    ),
  }),
) {}
