export type ReportSignedUrl = { name: string; signedUrl: string };

export interface ReportFileService {
  uploadFile(name: string, fileBuffer: Buffer): Promise<void>;
  getSignedUrls(attachedFileNames: string[]): Promise<ReportSignedUrl[]>;
}
