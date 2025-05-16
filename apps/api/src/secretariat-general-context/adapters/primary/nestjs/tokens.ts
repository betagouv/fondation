import {
  SharedKernelInjectionTokenMap,
  sharedKernelTokens,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';

export const SG_INSERT_QUERY = 'SG_INSERT_QUERY';

export const SECRETARIAT_GENERAL_TOKENS = [
  ...sharedKernelTokens,
  SG_INSERT_QUERY,
] as const;

export interface SecretariatGeneralInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [SG_INSERT_QUERY]: string;
}
