import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Role } from 'shared-models';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import {
  prismaRoleEnumToRoleEnum,
  roleEnumToPrismaRoleEnum,
} from 'src/modules/shared/mappers/role-enum.mapper';

@Injectable()
export class ListUsersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    search?: string;
    roles?: readonly Role[];
    excludeIds?: readonly string[];
    includeIds?: readonly string[];
    includeIdsOnly?: true;
  }): Promise<ListedUsersDto> {
    let excludeIds = new Set(query.excludeIds);
    const includeIds = new Set(query.includeIds).difference(excludeIds);
    excludeIds = excludeIds.union(includeIds);

    const OR: Prisma.UserWhereInput[] = [];
    if (includeIds.size) {
      OR.push({ id: { in: [...includeIds] } });
    }

    if (!(includeIds.size > 0 && query.includeIdsOnly)) {
      OR.push({
        id: { notIn: [...excludeIds] },
        role: query.roles
          ? { in: query.roles.map(roleEnumToPrismaRoleEnum) }
          : undefined,
        OR:
          query.search && query.search.length > 2
            ? [
                // prettier-ignore
                { email: { contains: query.search, mode: 'insensitive' } },
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
              ]
            : undefined,
      });
    }

    const items = await this.prisma.user.findMany({
      select: { id: true, role: true },
      orderBy: { lastName: 'asc' },
      where: { OR },
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
        role: z.enum(Role),
      }),
    ),
  }),
) {}
