import { FactoryProvider } from '@nestjs/common';
import { Class } from 'type-fest';
import { ReportsInjectionTokenMap, reportsTokens } from './tokens';
import {
  InjectedTokens,
  generateProvider,
} from 'src/shared-kernel/adapters/primary/nestjs/provider-generator';

export function generateReportsProvider<
  T extends Class<any>,
  TokenMap extends ReportsInjectionTokenMap,
  Tokens extends typeof reportsTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<
    TokenMap,
    Tokens,
    ConstructorParameters<T>[number]
  >[],
): FactoryProvider<T>;
export function generateReportsProvider<
  T extends Class<any>,
  TokenMap extends ReportsInjectionTokenMap,
  Tokens extends typeof reportsTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<
    TokenMap,
    Tokens,
    ConstructorParameters<T>[number]
  >[],
  providedToken?: string,
): FactoryProvider<T>;
export function generateReportsProvider<
  T extends Class<any>,
  TokenMap extends ReportsInjectionTokenMap,
  Tokens extends typeof reportsTokens,
>(
  targetClass: T,
  injectedTokens: InjectedTokens<
    TokenMap,
    Tokens,
    ConstructorParameters<T>[number]
  >[],
  providedToken?: string,
) {
  return generateProvider<T, TokenMap, Tokens>(
    targetClass,
    injectedTokens,
    providedToken,
  );
}
