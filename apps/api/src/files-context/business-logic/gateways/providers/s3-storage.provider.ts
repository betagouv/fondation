export interface S3StorageProvider {
  uploadFile(file: Buffer, fileName: string): Promise<string>;
  deleteFile(fileUri: string): Promise<void>;
}
