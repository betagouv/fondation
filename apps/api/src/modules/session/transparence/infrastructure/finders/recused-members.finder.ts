import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { assertPgParams } from '../../../../../utils/assert-pg-params';
import { Db } from '../../../../framework/database';
import { byProtocolOrder } from '../../../../shared/protocol-order';
import type { RecusedMember } from '../dtos/nomination-file.dto';

/** the recused members of each file, in protocol order */
@Injectable()
export class RecusedMembersFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async find(query: { nominationFileIds: ReadonlySet<string> }): Promise<Map<string, RecusedMember[]>> {
    if (query.nominationFileIds.size === 0) return new Map();
    assertPgParams(query.nominationFileIds);

    const recusals = await this.db.tx.recusedMember.findMany({
      select: {
        nominationFileId: true,
        user: { select: { firstName: true, id: true, lastName: true, sort: true } },
      } satisfies Prisma.RecusedMemberSelect,
      where: { nominationFileId: { in: [...query.nominationFileIds] } },
    });

    const members = new Map<string, RecusedMember[]>();
    for (const { nominationFileId, user } of recusals.sort((a, b) => byProtocolOrder(a.user, b.user))) {
      const member = { firstName: user.firstName, id: user.id, lastName: user.lastName };
      const fileMembers = members.get(nominationFileId);
      if (fileMembers) fileMembers.push(member);
      else members.set(nominationFileId, [member]);
    }
    return members;
  }

  @Transactional()
  async findFilesRecusedBy(query: {
    memberId: string;
    nominationFileIds: readonly string[];
  }): Promise<Set<string>> {
    if (query.nominationFileIds.length === 0) return new Set();
    assertPgParams(query.nominationFileIds);

    const recusals = await this.db.tx.recusedMember.findMany({
      select: { nominationFileId: true } satisfies Prisma.RecusedMemberSelect,
      where: { nominationFileId: { in: [...query.nominationFileIds] }, userId: query.memberId },
    });
    return new Set(recusals.map(({ nominationFileId }) => nominationFileId));
  }
}
