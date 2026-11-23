import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { assertPgParams } from '../../../../utils/assert-pg-params';
import { Db } from '../../../framework/database';
import { roleEnumToPrismaRoleEnum } from '../../../shared/mappers/role-enum.mapper';
import { MemberFormation, memberRolesOf } from '../member.utils';

export type ExcludingMember = { id: string; firstName: string; lastName: string };

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

  /** deactivated members included: a reporter deactivated since keeps the files they have */
  async findExcludingMembers(query: {
    formations: readonly MemberFormation[];
    jurisdictionIds: readonly string[];
  }): Promise<Map<string, ExcludingMember[]>> {
    if (query.jurisdictionIds.length === 0) return new Map();
    assertPgParams(query.jurisdictionIds);

    const exclusions = await this.db.tx.excludedJurisdiction.findMany({
      orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
      select: {
        jurisdictionId: true,
        user: { select: { firstName: true, id: true, lastName: true } },
      } satisfies Prisma.ExcludedJurisdictionSelect,
      where: {
        jurisdictionId: { in: [...query.jurisdictionIds] },
        user: { role: { in: memberRolesOf(query.formations).map(roleEnumToPrismaRoleEnum) } },
      },
    });

    const byJurisdictionId = new Map<string, ExcludingMember[]>();
    for (const { jurisdictionId, user } of exclusions) {
      byJurisdictionId.set(jurisdictionId, [...(byJurisdictionId.get(jurisdictionId) ?? []), user]);
    }

    return byJurisdictionId;
  }
}
