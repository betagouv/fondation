import { NominationFileReportRepository } from 'src/reporter-context/business-logic/gateways/repositories/Report.repository';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/NominationFileReport';

export class FakeNominationFileReportRepository
  implements NominationFileReportRepository
{
  reports: Record<string, NominationFileReport>;

  async byId(id: string): Promise<NominationFileReport> {
    return this.reports[id];
  }
  async save(report: NominationFileReport): Promise<void> {
    this.reports[report.id] = report;
  }
}
