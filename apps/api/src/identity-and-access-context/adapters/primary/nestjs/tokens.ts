import { EncryptionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/encryption.provider';
import { SessionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/session-provider';
import { SessionRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/session-repository';
import { UserRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/user-repository';
import {
  SharedKernelInjectionTokenMap,
  sharedKernelTokens,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { SignatureProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/signature.provider';

export const USER_REPOSITORY = 'USER_REPOSITORY';
export const ENCRYPTION_PROVIDER = 'ENCRYPTION_PROVIDER';
export const SESSION_PROVIDER = 'SESSION_PROVIDER';
export const SESSION_REPOSITORY = 'SESSION_REPOSITORY';
export const SIGNATURE_PROVIDER = 'SIGNATURE_PROVIDER';

export const identityAndAccessTokens = [
  ...sharedKernelTokens,
  USER_REPOSITORY,
  ENCRYPTION_PROVIDER,
  SESSION_PROVIDER,
  SESSION_REPOSITORY,
  SIGNATURE_PROVIDER,
] as const;

export interface IdentityAndAccessInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [USER_REPOSITORY]: UserRepository;
  [ENCRYPTION_PROVIDER]: EncryptionProvider;
  [SESSION_PROVIDER]: SessionProvider;
  [SESSION_REPOSITORY]: SessionRepository;
  [SIGNATURE_PROVIDER]: SignatureProvider;
}
