import { FactoryProvider } from '@nestjs/common';
import {
  SECRETARIAT_GENERAL_TOKENS,
  SecretariatGeneralInjectionTokenMap,
} from 'src/secretariat-general-context/adapters/primary/tokens';
import {
  InjectedTokens,
  generateProvider,
} from 'src/shared-kernel/adapters/primary/nestjs/provider-generator';
import { Class } from 'type-fest';

export function generateSecretariatGeneralProvider<
  T extends Class<any>,
  TokenMap extends SecretariatGeneralInjectionTokenMap,
  Tokens extends typeof SECRETARIAT_GENERAL_TOKENS,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
): FactoryProvider<T>;

export function generateSecretariatGeneralProvider<
  T extends Class<any>,
  TokenMap extends SecretariatGeneralInjectionTokenMap,
  Tokens extends typeof SECRETARIAT_GENERAL_TOKENS,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
  providedToken?: string,
): FactoryProvider<T>;

export function generateSecretariatGeneralProvider<
  T extends Class<any>,
  TokenMap extends SecretariatGeneralInjectionTokenMap,
  Tokens extends typeof SECRETARIAT_GENERAL_TOKENS,
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
