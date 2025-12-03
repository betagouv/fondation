import { S3StorageProvider } from 'src/files-context/business-logic/gateways/providers/s3-storage.provider';
import { FileDocument } from 'src/files-context/business-logic/models/file-document';

export class UploadFileService {
  constructor(private readonly s3StorageProvider: S3StorageProvider) {}

  getSignedUrl(file: FileDocument): Promise<string> {
    return this.s3StorageProvider.getSignedUrl(file);
  }
}
