import { ReportRepository } from 'src/reporter-context/business-logic/gateways/repositories/report.repository';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';

export class FakeNominationFileReportRepository implements ReportRepository {
  reports: Record<string, NominationFileReport> = {};

  save(report: NominationFileReport): TransactionableAsync<void> {
    return async () => {
      this.reports[report.id] = report;
    };
  }

  byId(id: string): TransactionableAsync<NominationFileReport | null> {
    return async () => this.reports[id] || null;
  }

  byNominationFileId(
    nominationFileId: string,
  ): TransactionableAsync<NominationFileReport[] | null> {
    return async () =>
      Object.values(this.reports).filter(
        (report) => report.nominationFileId === nominationFileId,
      ) || null;
  }
}
