import { S3StorageProvider } from 'src/files-context/business-logic/gateways/providers/s3-storage.provider';
import { FileRepository } from 'src/files-context/business-logic/gateways/repositories/file-repository';
import {
  SharedKernelInjectionTokenMap,
  sharedKernelTokens,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';

export const FILE_REPOSITORY = 'FILE_REPOSITORY';
export const S3_STORAGE_PROVIDER = 'S3_STORAGE_PROVIDER';

export const filesTokens = [
  ...sharedKernelTokens,
  FILE_REPOSITORY,
  S3_STORAGE_PROVIDER,
] as const;

export interface FilesInjectionTokenMap extends SharedKernelInjectionTokenMap {
  [FILE_REPOSITORY]: FileRepository;
  [S3_STORAGE_PROVIDER]: S3StorageProvider;
}
