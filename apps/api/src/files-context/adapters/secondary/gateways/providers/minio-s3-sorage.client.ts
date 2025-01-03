import { S3Client } from '@aws-sdk/client-s3';
import { buildFileStorageProviderEndpoint } from 'src/files-context/business-logic/builders/build-file-storage-provider-endpoint';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';

export const minioS3StorageClient = new S3Client({
  region: 'eu-west-2',
  endpoint: buildFileStorageProviderEndpoint(
    defaultApiConfig.s3.minio.endpoint,
  ),
  credentials: defaultApiConfig.s3.minio.credentials,
  forcePathStyle: true, // MinIO requires path-style URLs
});
