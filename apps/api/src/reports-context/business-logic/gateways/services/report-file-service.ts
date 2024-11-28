import { ReportAttachedFile } from '../../models/report-attached-file';

export type ReportSignedUrl = { name: string; signedUrl: string };

export interface ReportFileService {
  uploadFile(
    file: ReportAttachedFile,
    bucket: string,
    fileBuffer: Buffer,
  ): Promise<void>;
  getSignedUrls(attachedFileIds: string[]): Promise<ReportSignedUrl[]>;
  deleteFile(file: ReportAttachedFile, bucket: string): Promise<void>;
}
