import { ImportNominationFileFromLocalFileCli } from 'src/data-administration-context/transparence-tsv/adapters/primary/nestjs/import-nominations-from-local-file.cli';
import { TransparenceRepository } from 'src/data-administration-context/transparences/business-logic/gateways/repositories/transparence.repository';
import { UserService } from 'src/data-administration-context/transparences/business-logic/gateways/services/user.service';
import {
  SharedKernelInjectionTokenMap,
  sharedKernelTokens,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';

export const TRANSPARENCE_REPOSITORY = 'TRANSPARENCE_REPOSITORY';
export const IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI =
  'IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI';
export const USER_SERVICE = 'USER_SERVICE';

export const dataAdministrationTokens = [
  ...sharedKernelTokens,
  TRANSPARENCE_REPOSITORY,
  IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI,
  USER_SERVICE,
] as const;

export interface DataAdministrationInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [TRANSPARENCE_REPOSITORY]: TransparenceRepository;
  [IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI]: ImportNominationFileFromLocalFileCli;
  [USER_SERVICE]: UserService;
}
