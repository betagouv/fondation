import { S3Client } from '@aws-sdk/client-s3';
import { defaultApiConfig } from '../../../../../shared-kernel/adapters/primary/nestjs/env';

export const minioS3StorageClient = new S3Client({
  region: 'eu-west-2',
  endpoint: defaultApiConfig.s3.endpoint,
  credentials: defaultApiConfig.s3.credentials,
  forcePathStyle: true, // MinIO requires path-style URLs
});
