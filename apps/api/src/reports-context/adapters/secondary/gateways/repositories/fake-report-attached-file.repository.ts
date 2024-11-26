import { ReportAttachedFileRepository } from 'src/reports-context/business-logic/gateways/repositories/report-attached-file.repository';
import {
  ReportAttachedFile,
  ReportAttachedFileSnapshot,
} from 'src/reports-context/business-logic/models/report-attached-file';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeReportAttachedFileRepository
  implements ReportAttachedFileRepository
{
  files: Record<string, ReportAttachedFileSnapshot> = {};

  save(reportAttachedFile: ReportAttachedFile): TransactionableAsync {
    const reportAttachedFileSnapshot = reportAttachedFile.toSnapshot();
    return async () => {
      this.files[reportAttachedFileSnapshot.id] = reportAttachedFileSnapshot;
    };
  }

  byFileName(
    reportId: string,
    fileName: string,
  ): TransactionableAsync<ReportAttachedFile | null> {
    return async () => {
      const file = Object.values(this.files).find(
        (file) => file.reportId === reportId && file.name === fileName,
      );
      return file ? ReportAttachedFile.fromSnapshot(file) : null;
    };
  }
}
