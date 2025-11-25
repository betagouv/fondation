import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import { MEMBER_ROLES } from '../member.utils';
import { Magistrat } from 'shared-models';
import { PrismaRoleEnum } from 'src/generated/prisma/enums';

@Injectable()
export class InternalFindMembersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    ids: readonly string[] | undefined;
    formation: Magistrat.Formation | undefined;
  }): Promise<string[]> {
    let roles: PrismaRoleEnum[];
    switch (query.formation) {
      case Magistrat.Formation.PARQUET:
        roles = ['MEMBRE_DU_PARQUET', 'MEMBRE_COMMUN'];
        break;
      case Magistrat.Formation.SIEGE:
        roles = ['MEMBRE_DU_SIEGE', 'MEMBRE_COMMUN'];
        break;
      default:
        roles = MEMBER_ROLES;
        break;
    }

    const users = await this.prisma.user.findMany({
      where: {
        role: { in: roles },
        id: { in: query.ids as string[] | undefined },
      },
      select: { id: true },
    });

    return users.map(({ id }) => id);
  }
}
