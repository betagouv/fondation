import { ReportAttachedFile } from '../../models/report-attached-file';

export interface ReportAttachedFileRepository {
  save(
    id: string,
    reportId: string,
    fileId: string,
  ): Promise<ReportAttachedFile>;
}
