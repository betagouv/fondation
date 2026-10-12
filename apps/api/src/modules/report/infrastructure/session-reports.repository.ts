import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ReportsCreated, ReportsDeleted, ReportsRestored, SessionReports } from '../domain/session-reports';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { formationEnumToPrismaFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { assertNever } from 'src/utils/assert-never';
import { makeId } from 'src/utils/id';

import { getAllNominationSessionReportRules } from './nomination-session-report-rules';

@Injectable()
export class SessionReportsRepository {
  constructor(private readonly db: Db) {}

  async find(query: { sessionId: string }): Promise<SessionReports> {
    const reports = await this.db.tx.report.findMany({
      select: {
        _count: { select: { files: true, reportRules: { where: { validated: true } } } },
        comment: true,
        createdAt: true,
        id: true,
        isDeleted: true,
        nominationFileId: true,
        reporterId: true,
        state: true,
      } satisfies Prisma.ReportSelect,
      where: { sessionId: query.sessionId },
    });

    return SessionReports.from({
      reports: reports.map((report) => ({
        createdAt: report.createdAt,
        hasContent:
          report.comment !== null ||
          report.state !== 'NEW' ||
          report._count.files > 0 ||
          report._count.reportRules > 0,
        id: report.id,
        isDeleted: report.isDeleted,
        nominationFileId: report.nominationFileId,
        reporterId: report.reporterId,
      })),
      sessionId: query.sessionId,
    });
  }

  @Transactional(Propagation.Mandatory)
  async persist(sessionReports: SessionReports): Promise<void> {
    for (const message of sessionReports.messages) {
      if (message instanceof ReportsCreated) await this.persistReportsCreated(message);
      else if (message instanceof ReportsRestored) await this.persistReportsRestored(message);
      else if (message instanceof ReportsDeleted) await this.persistReportsDeleted(message);
      else assertNever(message);
    }
  }

  private async persistReportsCreated(message: ReportsCreated) {
    const reports = message.affectations.map((affectation) => ({ ...affectation, id: makeId('ReportId') }));

    await this.db.tx.report.createMany({
      data: reports.map((report) => ({
        formation: formationEnumToPrismaFormationEnum(message.formation),
        id: report.id,
        nominationFileId: report.nominationFileId,
        reporterId: report.reporterId,
        sessionId: message.sessionId,
      })),
    });
    await this.db.tx.reportRule.createMany({
      data: reports.flatMap(({ id }) =>
        getAllNominationSessionReportRules().map((rule) => ({ ...rule, reportId: id })),
      ),
    });
  }

  private persistReportsRestored(message: ReportsRestored) {
    return this.db.tx.report.updateMany({
      data: { isDeleted: false },
      where: { id: { in: [...message.reportIds] } },
    });
  }

  private persistReportsDeleted(message: ReportsDeleted) {
    return this.db.tx.report.updateMany({
      data: { isDeleted: true },
      where: { id: { in: [...message.reportIds] } },
    });
  }
}
