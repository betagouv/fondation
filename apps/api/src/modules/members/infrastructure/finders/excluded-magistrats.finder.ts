import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { assertPgParams } from '../../../../utils/assert-pg-params';
import { Db } from '../../../framework/database';

/** the members who excluded each magistrat */
@Injectable()
export class ExcludedMagistratsFinder {
  constructor(private readonly db: Db) {}

  async find(query: { magistratIds: ReadonlySet<string> }): Promise<Map<string, Set<string>>> {
    if (query.magistratIds.size === 0) return new Map();
    assertPgParams(query.magistratIds);

    const exclusions = await this.db.tx.excludedMagistrat.findMany({
      select: { magistratId: true, userId: true } satisfies Prisma.ExcludedMagistratSelect,
      where: { magistratId: { in: [...query.magistratIds] } },
    });

    const memberIdsByMagistratId = new Map<string, Set<string>>();
    for (const { magistratId, userId } of exclusions) {
      memberIdsByMagistratId.set(
        magistratId,
        (memberIdsByMagistratId.get(magistratId) ?? new Set()).add(userId),
      );
    }
    return memberIdsByMagistratId;
  }
}
