import { PutBucketCorsCommandInput, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import _ from 'lodash';
import { FileVM } from 'shared-models';
import { S3Commands } from 'src/files-context/business-logic/gateways/providers/s3-commands';
import { S3StorageProvider } from 'src/files-context/business-logic/gateways/providers/s3-storage.provider';
import { FileDocument } from 'src/files-context/business-logic/models/file-document';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

export class RealS3StorageProvider implements S3StorageProvider {
  constructor(
    private readonly s3Client: S3Client,
    private readonly apiConfig: ApiConfig,
    private readonly s3Commands: S3Commands,
  ) {}

  async setupCors(): Promise<void> {
    try {
      const corsInput: PutBucketCorsCommandInput = {
        Bucket: this.apiConfig.s3.reportsContext.attachedFilesBucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: [this.apiConfig.originUrl],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              MaxAgeSeconds: 86400, // 24h
            },
            {
              AllowedOrigins: [this.apiConfig.frontendOriginUrl],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              AllowedMethods: ['GET', 'HEAD'],
              MaxAgeSeconds: 86400, // 24h,
            },
          ],
        },
      };
      const command = this.s3Commands.putBucketCors(corsInput);
      await this.s3Client.send(command);
    } catch (error) {
      console.error(error);
      throw new Error('Error setting CORS configuration for S3 bucket');
    }
  }

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
    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error(error);
      throw new Error('Error uploading file to S3');
    }
  }

  async uploadFiles(
    files: {
      file: Buffer;
      fileName: string;
      mimeType: string;
      bucket: string;
      filePath: string[] | null;
    }[],
  ): Promise<PromiseSettledResult<void>[]> {
    // Ensure all buckets exist before attempting uploads
    const buckets = [...new Set(files.map((file) => file.bucket))];
    await Promise.all(buckets.map((bucket) => this.ensureBucketExists(bucket)));

    // Upload each file independently
    return Promise.allSettled(
      files.map(async ({ file, fileName, mimeType, bucket, filePath }) => {
        try {
          const command = this.s3Commands.putObject(
            bucket,
            file,
            fileName,
            mimeType,
            filePath,
          );
          await this.s3Client.send(command);
        } catch (error) {
          console.error(
            `Error uploading file ${fileName} to S3:`,
            error.message,
          );
          throw new Error(`Error uploading file ${fileName} to S3`);
        }
      }),
    );
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
    const command = this.s3Commands.deleteObject(bucket, bucketPath, fileName);
    await this.s3Client.send(command);
  }

  async deleteFiles(
    files: FileDocument[],
  ): Promise<PromiseSettledResult<void>[]> {
    const filesPerBucket = _.groupBy(files, (file) => file.toSnapshot().bucket);
    const deletePromises = Object.entries(filesPerBucket).map(
      async ([bucket, bucketFiles]) => {
        const command = this.s3Commands.deleteObjects(
          bucket,
          bucketFiles.map((file) => ({
            filePath: file.path,
            fileName: file.name,
          })),
        );
        await this.s3Client.send(command);
      },
    );

    return Promise.allSettled(deletePromises);
  }

  async restoreFiles(files: FileDocument[]): Promise<void> {
    const filesByBucket = _.groupBy(files, (file) => file.bucket);

    for (const [bucket, bucketFiles] of Object.entries(filesByBucket)) {
      for (const file of bucketFiles) {
        const { path, name } = file.toSnapshot();
        const key = this.s3Commands.genKey(path, name);

        try {
          await this.restoreFromVersioning(bucket, path, name);
        } catch (error) {
          console.error(
            `Failed to restore file ${key} in bucket ${bucket}:`,
            error,
          );
        }
      }
    }
  }

  private async restoreFromVersioning(
    bucket: string,
    bucketPath: string[] | null,
    fileName: string,
  ): Promise<void> {
    const command = this.s3Commands.listObjectVersions(
      bucket,
      bucketPath,
      fileName,
    );
    const response = await this.s3Client.send(command);
    if (!response.Versions || response.Versions.length === 0) {
      throw new Error(
        `No versions found for file ${fileName} in bucket ${bucket}`,
      );
    }

    const latestVersion = response.DeleteMarkers?.find(
      (version) => version.IsLatest,
    );
    if (!latestVersion || !latestVersion.VersionId) {
      throw new Error(
        `No valid previous version found for file ${fileName} in bucket ${bucket}`,
      );
    }

    const removeDeleteMarkerCommand = this.s3Commands.deleteObject(
      bucket,
      bucketPath,
      fileName,
      latestVersion.VersionId,
    );
    await this.s3Client.send(removeDeleteMarkerCommand);
  }

  private async ensureBucketExists(bucket: string): Promise<void> {
    try {
      const command = this.s3Commands.headBucket(bucket);
      await this.s3Client.send(command);
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
    try {
      const fileExists = await this.s3Client.send(
        this.s3Commands.headObject(bucket, filePath, fileName),
      );
      if (!fileExists)
        throw new Error(
          `File not found in bucket ${bucket} with name ${fileName} and path ${filePath}`,
        );
    } catch (error) {
      console.error('error', error);

      throw new Error(
        `S3 error while searching in bucket ${bucket} for the file name ${fileName} with path ${filePath}`,
        error,
      );
    }
  }
}
