import { FactoryProvider } from '@nestjs/common';
import { Class } from 'type-fest';
import { NominationsInjectionTokenMap, nominationsTokens } from './tokens';
import {
  InjectedTokens,
  generateProvider,
} from 'src/shared-kernel/adapters/primary/nestjs/provider-generator';

export function generateNominationsProvider<
  T extends Class<any>,
  TokenMap extends NominationsInjectionTokenMap,
  Tokens extends typeof nominationsTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
): FactoryProvider<T>;
export function generateNominationsProvider<
  T extends Class<any>,
  TokenMap extends NominationsInjectionTokenMap,
  Tokens extends typeof nominationsTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
  providedToken?: string,
): FactoryProvider<T>;
export function generateNominationsProvider<
  T extends Class<any>,
  TokenMap extends NominationsInjectionTokenMap,
  Tokens extends typeof nominationsTokens,
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
