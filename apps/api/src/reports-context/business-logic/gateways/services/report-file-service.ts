export interface ReportFileService {
  uploadFile(name: string, fileBuffer: Buffer): Promise<string>;
}
