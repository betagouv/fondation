import { ImportNominationFileFromLocalFileCli } from 'src/data-administration-context/business-logic/gateways/providers/import-nominations-from-local-file.cli';
import { NominationFileRepository } from 'src/data-administration-context/business-logic/gateways/repositories/nomination-file-repository';
import {
  SharedKernelInjectionTokenMap,
  sharedKernelTokens,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';

export const NOMINATION_FILE_REPOSITORY = 'NOMINATION_FILE_REPOSITORY';
export const IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI =
  'IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI';

export const dataAdministrationTokens = [
  ...sharedKernelTokens,
  NOMINATION_FILE_REPOSITORY,
  IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI,
] as const;

export interface DataAdministrationInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [NOMINATION_FILE_REPOSITORY]: NominationFileRepository;
  [IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI]: ImportNominationFileFromLocalFileCli;
}
