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

  /** the recused member ids of each file, for the rules that only compare them */
  async findIds(query: {
    nominationFileIds: ReadonlySet<string>;
  }): Promise<Map<string, ReadonlySet<string>>> {
    const members = await this.find(query);
    return new Map(
      members
        .entries()
        .map(([nominationFileId, list]) => [nominationFileId, new Set(list.map(({ id }) => id))]),
    );
  }
}
