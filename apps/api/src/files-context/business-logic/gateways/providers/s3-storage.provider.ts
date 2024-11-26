import { FileDocument, FileVM } from '../../models/file-document';

export interface S3StorageProvider {
  uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
    filePath: string[] | null,
  ): Promise<void>;
  getSignedUrls(files: FileDocument[]): Promise<FileVM[]>;
  deleteFile(fileName: string): Promise<void>;
}
