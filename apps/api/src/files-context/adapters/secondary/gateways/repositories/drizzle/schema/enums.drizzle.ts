import { FilesStorageProvider } from 'src/files-context/business-logic/models/files-provider.enum';
import { filesContextSchema } from './schema';

export const filesStorageProviderEnum = filesContextSchema.enum(
  'storage_provider',
  Object.values(FilesStorageProvider) as [
    FilesStorageProvider,
    ...FilesStorageProvider[],
  ],
);
