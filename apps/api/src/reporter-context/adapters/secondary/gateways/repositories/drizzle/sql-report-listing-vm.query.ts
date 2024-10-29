import { ReportListingVM } from 'shared-models';
import { ReportListingVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-listing-vm.query';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-instance';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { reports } from './schema/report-pm';

export class SqlReportListingVMQuery implements ReportListingVMQuery {
  constructor(private readonly db: DrizzleDb) {}

  async listReports(): Promise<ReportListingVM> {
    const reportsData = await this.db
      .select({
        id: reports.id,
        state: reports.state,
        dueDate: reports.dueDate,
        formation: reports.formation,
        name: reports.name,
        reporterName: reports.reporterName,
        transparency: reports.transparency,
        grade: reports.grade,
        targettedPosition: reports.targettedPosition,
      })
      .from(reports)
      .execute();

    return {
      data: reportsData.map((report) => ({
        id: report.id,
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
      })),
    };
  }
}
