import { FactoryProvider } from '@nestjs/common';
import { Class } from 'type-fest';
import {
  DataAdministrationInjectionTokenMap,
  dataAdministrationTokens,
} from './tokens';
import {
  InjectedTokens,
  generateProvider,
} from 'src/shared-kernel/adapters/primary/nestjs/provider-generator';

export function generateDataAdministrationProvider<
  T extends Class<any>,
  TokenMap extends DataAdministrationInjectionTokenMap,
  Tokens extends typeof dataAdministrationTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
): FactoryProvider<T>;
export function generateDataAdministrationProvider<
  T extends Class<any>,
  TokenMap extends DataAdministrationInjectionTokenMap,
  Tokens extends typeof dataAdministrationTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
  providedToken?: string,
): FactoryProvider<T>;
export function generateDataAdministrationProvider<
  T extends Class<any>,
  TokenMap extends DataAdministrationInjectionTokenMap,
  Tokens extends typeof dataAdministrationTokens,
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
