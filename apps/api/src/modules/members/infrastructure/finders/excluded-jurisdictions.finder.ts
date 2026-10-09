import { Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { assertPgParams } from 'src/utils/assert-pg-params';

@Injectable()
export class ExcludedJurisdictionsFinder {
  constructor(private readonly db: Db) {}

  async find(query: { memberIds: readonly string[] }): Promise<Map<string, Set<string>>> {
    assertPgParams(query.memberIds);

    const exclusions = await this.db.tx.excludedJurisdiction.findMany({
      select: { jurisdictionId: true, userId: true } satisfies Prisma.ExcludedJurisdictionSelect,
      where: { userId: { in: [...query.memberIds] } },
    });

    const byMemberId = new Map<string, Set<string>>();
    for (const { jurisdictionId, userId } of exclusions) {
      byMemberId.set(userId, (byMemberId.get(userId) ?? new Set()).add(jurisdictionId));
    }

    return byMemberId;
  }
}
