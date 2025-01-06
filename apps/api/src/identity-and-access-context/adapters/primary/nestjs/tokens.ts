import { EncryptionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/encryption.provider';
import { UserRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/user-repository';
import {
  SharedKernelInjectionTokenMap,
  sharedKernelTokens,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';

export const USER_REPOSITORY = 'USER_REPOSITORY';
export const ENCRYPTION_PROVIDER = 'ENCRYPTION_PROVIDER';

export const identityAndAccessTokens = [
  ...sharedKernelTokens,
  USER_REPOSITORY,
  ENCRYPTION_PROVIDER,
] as const;

export interface IdentityAndAccessInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [USER_REPOSITORY]: UserRepository;
  [ENCRYPTION_PROVIDER]: EncryptionProvider;
}
