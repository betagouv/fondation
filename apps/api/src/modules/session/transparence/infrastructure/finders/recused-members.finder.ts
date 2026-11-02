import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { assertPgParams } from '../../../../../utils/assert-pg-params';
import { Db } from '../../../../framework/database';

export type RecusedMember = { firstName: string; id: string; lastName: string };

/** the recused members of each file, in protocol order as the official report prints them */
@Injectable()
export class RecusedMembersFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async find(query: { nominationFileIds: ReadonlySet<string> }): Promise<Map<string, RecusedMember[]>> {
    if (query.nominationFileIds.size === 0) return new Map();
    assertPgParams(query.nominationFileIds);

    const recusals = await this.db.tx.recusedMember.findMany({
      orderBy: [{ user: { sort: 'asc' } }, { user: { lastName: 'asc' } }],
      select: {
        nominationFileId: true,
        user: { select: { firstName: true, id: true, lastName: true } },
      } satisfies Prisma.RecusedMemberSelect,
      where: { nominationFileId: { in: [...query.nominationFileIds] } },
    });

    const members = new Map<string, RecusedMember[]>();
    for (const { nominationFileId, user } of recusals) {
      const fileMembers = members.get(nominationFileId);
      if (fileMembers) fileMembers.push(user);
      else members.set(nominationFileId, [user]);
    }
    return members;
  }
}
