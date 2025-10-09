import { EncryptionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/encryption.provider';
import { SessionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/session-provider';
import { FileRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/file-repository';
import { SessionRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/session-repository';
import { UserRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/user-repository';
import {
  SharedKernelInjectionTokenMap,
  sharedKernelTokens,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';

export const USER_REPOSITORY = 'USER_REPOSITORY';
export const FILE_REPOSITORY = 'FILE_REPOSITORY';
export const ENCRYPTION_PROVIDER = 'ENCRYPTION_PROVIDER';
export const SESSION_PROVIDER = 'SESSION_PROVIDER';
export const SESSION_REPOSITORY = 'SESSION_REPOSITORY';

export const identityAndAccessTokens = [
  ...sharedKernelTokens,
  USER_REPOSITORY,
  FILE_REPOSITORY,
  ENCRYPTION_PROVIDER,
  SESSION_PROVIDER,
  SESSION_REPOSITORY,
] as const;

export interface IdentityAndAccessInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [USER_REPOSITORY]: UserRepository;
  [FILE_REPOSITORY]: FileRepository;
  [ENCRYPTION_PROVIDER]: EncryptionProvider;
  [SESSION_PROVIDER]: SessionProvider;
  [SESSION_REPOSITORY]: SessionRepository;
}
