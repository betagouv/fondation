import { S3Client } from '@aws-sdk/client-s3';
import { defaultApiConfig } from '../../../../../shared-kernel/adapters/primary/nestjs/env';
import { buildFileStorageProviderEndpoint } from '../../../../business-logic/builders/build-file-storage-provider-endpoint';

export const scalewayS3StorageClient = new S3Client({
  region: defaultApiConfig.s3.scaleway.region,
  endpoint: buildFileStorageProviderEndpoint(
    defaultApiConfig.s3.scaleway.endpoint,
  ),
  credentials: defaultApiConfig.s3.scaleway.credentials,
});
