import { ReportListingVM } from 'shared-models';
import { ReportListingQuery } from 'src/reports-context/business-logic/gateways/queries/report-listing-vm.query';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { reports } from './schema/report-pm';
import { sql, eq } from 'drizzle-orm';

export class SqlReportListingQuery implements ReportListingQuery {
  constructor(private readonly db: DrizzleDb) {}

  async listReports(reporterId: string): Promise<ReportListingVM> {
    const reportsData = await this.db
      .select({
        id: reports.id,
        folderNumber: reports.folderNumber,
        state: reports.state,
        dueDate: reports.dueDate,
        formation: reports.formation,
        name: reports.name,
        reporterName: reports.reporterName,
        transparency: reports.transparency,
        grade: reports.grade,
        targettedPosition: reports.targettedPosition,
        observersCount: sql<number>`COALESCE(array_length(${reports.observers}, 1), 0)`,
      })
      .from(reports)
      .where(eq(reports.reporterId, reporterId))
      .execute();

    return {
      data: reportsData.map((report) => ({
        id: report.id,
        folderNumber: report.folderNumber,
        state: report.state,
        dueDate: report.dueDate
          ? DateOnly.fromDbDateOnlyString(report.dueDate).toJson()
          : null,
        formation: report.formation,
        name: report.name,
        reporterName: report.reporterName,
        transparency: report.transparency,
        grade: report.grade,
        targettedPosition: report.targettedPosition,
        observersCount: report.observersCount,
      })),
    };
  }
}
