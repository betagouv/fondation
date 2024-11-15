import { ReportRepository } from 'src/reports-context/business-logic/gateways/repositories/report.repository';
import {
  NominationFileReport,
  NominationFileReportSnapshot,
} from 'src/reports-context/business-logic/models/nomination-file-report';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeNominationFileReportRepository implements ReportRepository {
  reports: Record<string, NominationFileReportSnapshot> = {};

  save(report: NominationFileReport): TransactionableAsync<void> {
    const snapshot = report.toSnapshot();
    return async () => {
      this.reports[snapshot.id] = snapshot;
    };
  }

  byId(id: string): TransactionableAsync<NominationFileReport | null> {
    return async () =>
      this.reports[id]
        ? NominationFileReport.fromSnapshot(this.reports[id])
        : null;
  }

  byNominationFileId(
    nominationFileId: string,
  ): TransactionableAsync<NominationFileReport[] | null> {
    return async () =>
      Object.values(this.reports)
        .map(NominationFileReport.fromSnapshot)
        .filter((report) => report.nominationFileId === nominationFileId) ||
      null;
  }
}
