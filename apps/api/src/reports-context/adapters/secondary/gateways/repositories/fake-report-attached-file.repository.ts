import { ReportAttachedFileRepository } from 'src/reports-context/business-logic/gateways/repositories/report-attached-file.repository';
import {
  ReportAttachedFile,
  ReportAttachedFileSnapshot,
} from 'src/reports-context/business-logic/models/report-attached-file';

export class FakeReportAttachedFileRepository
  implements ReportAttachedFileRepository
{
  readonly files: Record<string, ReportAttachedFileSnapshot> = {};

  async save(
    id: string,
    reportId: string,
    fileId: string,
  ): Promise<ReportAttachedFile> {
    this.files[id] = {
      id,
      reportId,
      fileId,
    };
    return ReportAttachedFile.fromSnapshot(this.files[id]);
  }
}
