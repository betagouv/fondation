import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { PrismaRoleEnum } from '../../../../generated/prisma/enums';
import { Db } from '../../../framework/database';
import { FormationEnum } from '../../../shared/formation.enum';
import { MEMBER_ROLES } from '../../../shared/role.enum';

@Injectable()
export class InternalFindMembersQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    ids: readonly string[] | undefined;
    formation: FormationEnum | undefined;
  }): Promise<string[]> {
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

    const users = await this.db.tx.user.findMany({
      select: { id: true } satisfies Prisma.UserSelect,
      where: {
        deactivatedAt: null,
        id: { in: query.ids as string[] | undefined },
        role: { in: roles },
      },
    });

    return users.map(({ id }) => id);
  }
}
