import { FactoryProvider } from '@nestjs/common';
import { Class } from 'type-fest';
import { InjectedTokens, generateProvider } from './provider-generator';
import { SharedKernelInjectionTokenMap, sharedKernelTokens } from './tokens';

export function generateSharedKernelProvider<
  T extends Class<any>,
  TokenMap extends SharedKernelInjectionTokenMap,
  Tokens extends typeof sharedKernelTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
): FactoryProvider<T>;
export function generateSharedKernelProvider<
  T extends Class<any>,
  TokenMap extends SharedKernelInjectionTokenMap,
  Tokens extends typeof sharedKernelTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
  providedToken?: string,
): FactoryProvider<T>;
export function generateSharedKernelProvider<
  T extends Class<any>,
  TokenMap extends SharedKernelInjectionTokenMap,
  Tokens extends typeof sharedKernelTokens,
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
