import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { MEMBER_ROLES } from '../member.utils';
import { PrismaRoleEnum } from 'src/generated/prisma/enums';
import { Db } from 'src/modules/framework/database';
import { FormationEnum } from 'src/modules/shared/formation.enum';

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
      select: { id: true },
      where: {
        role: { in: roles },
        id: { in: query.ids as string[] | undefined },
      },
    });

    return users.map(({ id }) => id);
  }
}
