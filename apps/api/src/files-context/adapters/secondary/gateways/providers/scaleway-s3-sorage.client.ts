import { S3Client } from '@aws-sdk/client-s3';
import { buildFileStorageProviderEndpoint } from 'src/files-context/business-logic/builders/build-file-storage-provider-endpoint';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';

export const scalewayS3StorageClient = new S3Client({
  region: defaultApiConfig.s3.scaleway.region,
  endpoint: buildFileStorageProviderEndpoint(
    defaultApiConfig.s3.scaleway.endpoint,
  ),
  credentials: defaultApiConfig.s3.scaleway.credentials,
});
