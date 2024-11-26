import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Commands } from 'src/files-context/business-logic/gateways/providers/s3-commands';
import { S3StorageProvider } from 'src/files-context/business-logic/gateways/providers/s3-storage.provider';
import {
  FileDocument,
  FileVM,
} from 'src/files-context/business-logic/models/file-document';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/nestia/api-config-schema';

export class RealS3StorageProvider implements S3StorageProvider {
  constructor(
    private readonly s3Client: S3Client,
    private readonly apiConfig: ApiConfig<false>,
    private readonly s3Commands: S3Commands,
  ) {}

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<void> {
    await this.ensureBucketExists();

    const bucketName = this.apiConfig.s3.bucketName;
    const command = this.s3Commands.putObject(
      bucketName,
      fileBuffer,
      fileName,
      mimeType,
    );

    await this.s3Client.send(command);
  }

  async getSignedUrls(files: FileDocument[]): Promise<FileVM[]> {
    const bucketName = this.apiConfig.s3.bucketName;

    const signedUrls = await Promise.all(
      files.map(async (file) => {
        const fileSnapshot = file.toSnapshot();
        const command = this.s3Commands.getObject(
          bucketName,
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

  async deleteFile(fileName: string): Promise<void> {
    const bucketName = this.apiConfig.s3.bucketName;
    const command = this.s3Commands.deleteFile(bucketName, fileName);

    await this.s3Client.send(command);
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(
        this.s3Commands.headBucket(this.apiConfig.s3.bucketName),
      );
    } catch (error: any) {
      if (error.name === 'NotFound') {
        await this.s3Client.send(
          this.s3Commands.createBucket(this.apiConfig.s3.bucketName),
        );
      } else {
        throw error;
      }
    }
  }
}
