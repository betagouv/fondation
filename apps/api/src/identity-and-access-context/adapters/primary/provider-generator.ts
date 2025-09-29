import { FactoryProvider } from '@nestjs/common';
import {
  InjectedTokens,
  generateProvider,
} from 'src/shared-kernel/adapters/primary/nestjs/provider-generator';
import { Class } from 'type-fest';
import {
  IdentityAndAccessInjectionTokenMap,
  identityAndAccessTokens,
} from './tokens';

export function generateIdentityAndAccessProvider<
  T extends Class<any>,
  TokenMap extends IdentityAndAccessInjectionTokenMap,
  Tokens extends typeof identityAndAccessTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
): FactoryProvider<T>;
export function generateIdentityAndAccessProvider<
  T extends Class<any>,
  TokenMap extends IdentityAndAccessInjectionTokenMap,
  Tokens extends typeof identityAndAccessTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
  providedToken?: string,
): FactoryProvider<T>;
export function generateIdentityAndAccessProvider<
  T extends Class<any>,
  TokenMap extends IdentityAndAccessInjectionTokenMap,
  Tokens extends typeof identityAndAccessTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
  providedToken?: string,
) {
  return generateProvider<T, TokenMap, Tokens>(
    targetClass,
    injectedTokens,
    providedToken,
  );
}
