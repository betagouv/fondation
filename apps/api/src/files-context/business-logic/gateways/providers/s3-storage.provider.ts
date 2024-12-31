import { FileVM } from 'shared-models/models/endpoints/files';
import { FileDocument } from '../../models/file-document';

export interface S3StorageProvider {
  uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
    bucket: string,
    filePath: string[] | null,
  ): Promise<void>;
  getSignedUrls(files: FileDocument[]): Promise<FileVM[]>;
  deleteFile(
    bucket: string,
    bucketPath: string[] | null,
    fileName: string,
  ): Promise<void>;
}
