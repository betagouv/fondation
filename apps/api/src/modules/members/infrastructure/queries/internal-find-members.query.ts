import { Injectable } from '@nestjs/common';

import { MEMBER_ROLES } from '../member.utils';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaRoleEnum } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/modules/framework/database';
import { FormationEnum } from 'src/modules/shared/formation.enum';

@Injectable()
export class InternalFindMembersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    ids: readonly string[] | undefined;
    formation: FormationEnum | undefined;
    tx?: Prisma.TransactionClient;
  }): Promise<string[]> {
    if (!query.tx) return this.prisma.$transaction((tx) => this.handle({ ...query, tx }));

    let roles: PrismaRoleEnum[];
    switch (query.formation) {
      case 'PARQUET':
        roles = ['MEMBRE_DU_PARQUET', 'MEMBRE_COMMUN'];
        break;
      case 'SIEGE':
        roles = ['MEMBRE_DU_SIEGE', 'MEMBRE_COMMUN'];
        break;
      default:
        roles = MEMBER_ROLES;
        break;
    }

    const users = await query.tx.user.findMany({
      select: { id: true },
      where: {
        role: { in: roles },
        id: { in: query.ids as string[] | undefined },
      },
    });

    return users.map(({ id }) => id);
  }
}
