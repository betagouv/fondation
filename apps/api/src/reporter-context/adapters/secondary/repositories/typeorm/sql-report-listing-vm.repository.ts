import { ReportListingVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-listing-vm.query';
import { ReportListingVM } from 'src/reporter-context/business-logic/models/reports-listing-vm';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { DataSource } from 'typeorm';
import { ReportPm } from './entities/report-pm';

export class SqlReportListingVMRepository implements ReportListingVMQuery {
  constructor(private readonly dataSource: DataSource) {}

  async listReports(): Promise<ReportListingVM> {
    const reports = await this.dataSource.getRepository(ReportPm).find({
      select: {
        id: true,
        name: true,
        dueDate: true,
      },
    });

    return {
      data: reports.map((report) => ({
        id: report.id,
        name: report.name,
        dueDate: report.dueDate
          ? DateOnly.fromDate(report.dueDate).toFormattedString()
          : null,
      })),
    };
  }
}
