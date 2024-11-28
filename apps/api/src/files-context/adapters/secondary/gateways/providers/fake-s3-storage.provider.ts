import { S3StorageProvider } from 'src/files-context/business-logic/gateways/providers/s3-storage.provider';
import {
  FileDocument,
  FileVM,
} from 'src/files-context/business-logic/models/file-document';

type FileName = string;

export class FakeS3StorageProvider implements S3StorageProvider {
  uploadFileError: Error;
  deleteFileError: Error;

  storedFiles: Record<
    FileName,
    {
      file: Buffer;
      fileName: FileName;
      mimeType: string;
      bucket: string;
      filePath: string[] | null;
      signedUrl?: string;
    }
  > = {};

  async uploadFile(
    file: Buffer,
    fileName: FileName,
    mimeType: string,
    bucket: string,
    filePath: string[] | null,
  ): Promise<void> {
    if (this.uploadFileError) throw this.uploadFileError;

    this.storedFiles[fileName] = { file, fileName, mimeType, bucket, filePath };
  }

  async getSignedUrls(files: FileDocument[]): Promise<FileVM[]> {
    return files.map((file) => {
      const { name } = file.toSnapshot();
      file.addSignedUrl(this.storedFiles[name]!.signedUrl!);
      return file.getFileVM();
    });
  }

  deleteFile(_: unknown, __: unknown, fileName: FileName): Promise<void> {
    if (this.deleteFileError) throw this.deleteFileError;

    delete this.storedFiles[fileName];
    return Promise.resolve();
  }
}
