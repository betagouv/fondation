import { ReportRepository } from 'src/reporter-context/business-logic/gateways/repositories/report.repository';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';

export class FakeNominationFileReportRepository implements ReportRepository {
  reports: Record<string, NominationFileReport> = {};

  byId(id: string): TransactionableAsync<NominationFileReport | null> {
    return async () => {
      const report = this.reports[id];
      return report || null;
    };
  }
  save(report: NominationFileReport): TransactionableAsync<void> {
    return async () => {
      this.reports[report.id] = report;
    };
  }
}
