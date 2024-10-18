import { ReportListingVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-listing-vm.query';
import { ReportListingVM } from '@/shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { DataSource } from 'typeorm';
import { ReportPm } from './entities/report-pm';

export class SqlReportListingVMQuery implements ReportListingVMQuery {
  constructor(private readonly dataSource: DataSource) {}

  async listReports(): Promise<ReportListingVM> {
    const reports = await this.dataSource.getRepository(ReportPm).find({
      select: {
        id: true,
        state: true,
        dueDate: true,
        formation: true,
        name: true,
        transparency: true,
        grade: true,
        targettedPosition: true,
      },
    });

    return {
      data: reports.map((report) => ({
        id: report.id,
        state: report.state,
        dueDate: report.dueDate
          ? DateOnly.fromDate(report.dueDate).toJson()
          : null,
        formation: report.formation,
        name: report.name,
        transparency: report.transparency,
        grade: report.grade,
        targettedPosition: report.targettedPosition,
      })),
    };
  }
}
