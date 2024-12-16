import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Commands } from 'src/files-context/business-logic/gateways/providers/s3-commands';
import { S3StorageProvider } from 'src/files-context/business-logic/gateways/providers/s3-storage.provider';
import {
  FileDocument,
  FileVM,
} from 'src/files-context/business-logic/models/file-document';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

export class RealS3StorageProvider implements S3StorageProvider {
  constructor(
    private readonly s3Client: S3Client,
    private readonly apiConfig: ApiConfig,
    private readonly s3Commands: S3Commands,
  ) {}

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    bucket: string,
    filePath: string[] | null,
  ): Promise<void> {
    await this.ensureBucketExists(bucket);
    const command = this.s3Commands.putObject(
      bucket,
      fileBuffer,
      fileName,
      mimeType,
      filePath,
    );
    await this.s3Client.send(command);
  }

  async getSignedUrls(files: FileDocument[]): Promise<FileVM[]> {
    const signedUrls = await Promise.all(
      files.map(async (file) => {
        const fileSnapshot = file.toSnapshot();
        await this.fileExistsGuard(
          fileSnapshot.bucket,
          fileSnapshot.path,
          fileSnapshot.name,
        );

        const command = this.s3Commands.getObject(
          fileSnapshot.bucket,
          fileSnapshot.path,
          fileSnapshot.name,
        );

        const signedUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: this.apiConfig.s3.signedUrlExpiresIn,
        });

        file.addSignedUrl(signedUrl);
        return file.getFileVM();
      }),
    );

    return signedUrls;
  }

  async deleteFile(
    bucket: string,
    bucketPath: string[] | null,
    fileName: string,
  ): Promise<void> {
    const command = this.s3Commands.deleteFile(bucket, bucketPath, fileName);
    await this.s3Client.send(command);
  }

  private async ensureBucketExists(bucket: string): Promise<void> {
    try {
      await this.s3Client.send(this.s3Commands.headBucket(bucket));
    } catch (error) {
      console.error(error);
      if (error.name === 'NotFound') {
        throw new Error(`Bucket ${bucket} not found`);
      } else {
        throw error;
      }
    }
  }

  private async fileExistsGuard(
    bucket: string,
    filePath: string[] | null,
    fileName: string,
  ) {
    const fileExists = await this.s3Client.send(
      this.s3Commands.headObject(bucket, filePath, fileName),
    );

    if (!fileExists)
      throw new Error(
        `File not found in bucket ${bucket} with name ${fileName} and path ${filePath}`,
      );
  }
}
