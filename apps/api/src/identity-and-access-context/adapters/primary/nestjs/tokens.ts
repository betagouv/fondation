import { UserRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/user-repository';
import {
  SharedKernelInjectionTokenMap,
  sharedKernelTokens,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export const identityAndAccessTokens = [
  ...sharedKernelTokens,
  USER_REPOSITORY,
] as const;

export interface IdentityAndAccessInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [USER_REPOSITORY]: UserRepository;
}
