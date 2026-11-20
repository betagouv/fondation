import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { assertPgParams } from '../../../../utils/assert-pg-params';
import { Db } from '../../../framework/database';
import { prismaReportStateEnumToReportState } from '../../../shared/mappers/rapport-statut.mapper';
import { noReportStates, type ReportStateCounts } from '../../../shared/report-state.enum';

@Injectable()
export class MemberReportStatesFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async find(query: {
    reporterId: string;
    sessionIds: readonly string[];
  }): Promise<Map<string, ReportStateCounts>> {
    assertPgParams(query.sessionIds);

    const groups = await this.db.tx.report.groupBy({
      _count: { _all: true },
      by: ['sessionId', 'state'],
      where: { isDeleted: false, reporterId: query.reporterId, sessionId: { in: [...query.sessionIds] } },
    });

    const countsBySession = new Map<string, ReportStateCounts>();
    for (const group of groups) {
      const counts = countsBySession.get(group.sessionId) ?? noReportStates();
      counts[prismaReportStateEnumToReportState(group.state)] = group._count._all;
      countsBySession.set(group.sessionId, counts);
    }
    return countsBySession;
  }
}
