import { S3StorageProvider } from 'src/files-context/business-logic/gateways/providers/s3-storage.provider';

export class FakeS3StorageProvider implements S3StorageProvider {
  fileUri: string = 'https://example.com/file-name.txt';

  storedFiles: Record<
    string,
    {
      file: Buffer;
      fileName: string;
    }
  > = {};

  uploadFile(file: Buffer, fileName: string): Promise<string> {
    this.storedFiles[this.fileUri] = { file, fileName };
    return Promise.resolve(this.fileUri);
  }
  deleteFile(fileUri: string): Promise<void> {
    delete this.storedFiles[fileUri];
    return Promise.resolve();
  }
}
