import { ReportRepository } from 'src/reporter-context/business-logic/gateways/repositories/report.repository';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { DataSource } from 'typeorm';
import { ReportPm } from './entities/report-pm';

export class SqlNominationFileReportRepository implements ReportRepository {
  constructor(private dataSource: DataSource) {}

  async save(report: NominationFileReport): Promise<void> {
    await this.dataSource
      .getRepository(ReportPm)
      .save(ReportPm.fromDomain(report));
  }

  async byId(id: string): Promise<NominationFileReport | null> {
    const reportPm = await this.dataSource.getRepository(ReportPm).findOne({
      where: { id },
    });
    if (!reportPm) return null;
    return reportPm.toDomain();
  }
}
