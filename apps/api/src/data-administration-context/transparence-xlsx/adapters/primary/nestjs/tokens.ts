import { ImportNominationFileFromLocalFileCli } from 'src/data-administration-context/transparence-tsv/adapters/primary/nestjs/import-nominations-from-local-file.cli';
import { IACFileRepository } from 'src/data-administration-context/transparence-xlsx/business-logic/gateways/repositories/iac-file-repository';
import { TransparenceFileRepository } from 'src/data-administration-context/transparence-xlsx/business-logic/gateways/repositories/transparence-file-repository';
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
export const TRANSPARENCE_FILE_REPOSITORY = 'TRANSPARENCE_FILE_REPOSITORY';
export const IAC_FILE_REPOSITORY = 'IAC_FILE_REPOSITORY';

export const dataAdministrationTokens = [
  ...sharedKernelTokens,
  TRANSPARENCE_REPOSITORY,
  IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI,
  USER_SERVICE,
  TRANSPARENCE_FILE_REPOSITORY,
  IAC_FILE_REPOSITORY,
] as const;

export interface DataAdministrationInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [TRANSPARENCE_REPOSITORY]: TransparenceRepository;
  [IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI]: ImportNominationFileFromLocalFileCli;
  [USER_SERVICE]: UserService;
  [TRANSPARENCE_FILE_REPOSITORY]: TransparenceFileRepository;
  [IAC_FILE_REPOSITORY]: IACFileRepository;
}
