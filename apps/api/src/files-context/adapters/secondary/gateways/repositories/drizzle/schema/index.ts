import { FilesStorageProvider } from 'src/files-context/business-logic/models/files-provider.enum';
import * as schema from 'src/modules/framework/drizzle/schemas';
import { assertNever } from 'src/utils/assert-never';

type DrizzleFileStorageProviderEnum =
  (typeof schema.filesStorageProviderEnum)['enumValues'][number];
export function toFilesStorageProvider(
  value: DrizzleFileStorageProviderEnum,
): FilesStorageProvider {
  switch (value) {
    case 'SCALEWAY':
      return FilesStorageProvider.SCALEWAY;
    default:
      return assertNever(value);
  }
}

export * from './tables';
