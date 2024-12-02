import { ReportAttachedFile } from '../../models/report-attached-file';
import { ReportAttachedFiles } from '../../models/report-attached-files';

export type ReportSignedUrl = { name: string; signedUrl: string };

export interface ReportFileService {
  uploadFile(
    file: ReportAttachedFile,
    fileBuffer: Buffer,
    filePath: string[],
  ): Promise<void>;
  getSignedUrl(attachedFile: ReportAttachedFile): Promise<ReportSignedUrl>;
  getSignedUrls(attachedFiles: ReportAttachedFiles): Promise<ReportSignedUrl[]>;
  deleteFile(file: ReportAttachedFile): Promise<void>;
}
