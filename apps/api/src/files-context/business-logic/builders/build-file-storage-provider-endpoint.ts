import { S3Config } from '../../../shared-kernel/adapters/primary/zod/api-config-schema';

export const buildFileStorageProviderEndpoint = (
  endpoint: S3Config['endpoint'],
) => {
  return `${endpoint.scheme}://${endpoint.baseDomain}`;
};
