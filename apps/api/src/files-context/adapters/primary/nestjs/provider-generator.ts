import { FactoryProvider } from '@nestjs/common';
import { Class } from 'type-fest';
import { FilesInjectionTokenMap, filesTokens } from './tokens';
import {
  InjectedTokens,
  generateProvider,
} from 'src/shared-kernel/adapters/primary/nestjs/provider-generator';

export function generateFilesProvider<
  T extends Class<any>,
  TokenMap extends FilesInjectionTokenMap,
  Tokens extends typeof filesTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
): FactoryProvider<T>;
export function generateFilesProvider<
  T extends Class<any>,
  TokenMap extends FilesInjectionTokenMap,
  Tokens extends typeof filesTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
  providedToken?: string,
): FactoryProvider<T>;
export function generateFilesProvider<
  T extends Class<any>,
  TokenMap extends FilesInjectionTokenMap,
  Tokens extends typeof filesTokens,
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
