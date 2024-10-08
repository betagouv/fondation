import { ReportRepository } from 'src/reporter-context/business-logic/gateways/repositories/report.repository';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';

export class FakeNominationFileReportRepository implements ReportRepository {
  reports: Record<string, NominationFileReport>;

  async byId(id: string): Promise<NominationFileReport | null> {
    const report = this.reports[id];
    return report || null;
  }
  async save(report: NominationFileReport): Promise<void> {
    this.reports[report.id] = report;
  }
}
