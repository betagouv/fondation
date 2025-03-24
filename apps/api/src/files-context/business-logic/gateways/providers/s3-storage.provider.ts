import { FileVM } from 'shared-models';
import { FileDocument } from '../../models/file-document';

export interface S3StorageProvider {
  uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
    bucket: string,
    filePath: string[] | null,
  ): Promise<void>;
  uploadFiles(
    files: Array<{
      file: Buffer;
      fileName: string;
      mimeType: string;
      bucket: string;
      filePath: string[] | null;
    }>,
  ): Promise<PromiseSettledResult<void>[]>;
  getSignedUrls(files: FileDocument[]): Promise<FileVM[]>;
  deleteFile(
    bucket: string,
    bucketPath: string[] | null,
    fileName: string,
  ): Promise<void>;
  deleteFiles(files: FileDocument[]): Promise<PromiseSettledResult<void>[]>;
  restoreFiles(files: FileDocument[]): Promise<void>;
}
