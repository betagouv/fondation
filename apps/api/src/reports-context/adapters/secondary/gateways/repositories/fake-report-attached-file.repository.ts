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
  saveError: Error;

  save(reportAttachedFile: ReportAttachedFile): TransactionableAsync {
    if (this.saveError) {
      throw this.saveError;
    }

    const reportAttachedFileSnapshot = reportAttachedFile.toSnapshot();
    return async () => {
      this.files[reportAttachedFileSnapshot.name] = reportAttachedFileSnapshot;
    };
  }

  byFileName(
    _: string,
    fileName: string,
  ): TransactionableAsync<ReportAttachedFile | null> {
    return async () => {
      const file = Object.values(this.files).find(
        (file) => file.name === fileName,
      );
      return file ? ReportAttachedFile.fromSnapshot(file) : null;
    };
  }
}
