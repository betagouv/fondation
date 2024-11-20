import { FactoryProvider, InjectionToken } from '@nestjs/common';
import 'reflect-metadata';
import { Class, FixedLengthArray, UnionToTuple } from 'type-fest';

type KeyByValueType<TObj, TValue> = {
  [K in keyof TObj]: TObj[K] extends TValue ? K : never;
}[keyof TObj];

export type InjectedParameters<
  TokenMap extends Record<string, string>,
  T extends readonly (keyof TokenMap)[],
> = {
  [K in keyof T]: T[K] extends keyof TokenMap ? TokenMap[T[K]] : never;
};

export type InjectedTokens<
  TokenMap extends Record<string, any>,
  Tokens extends readonly string[],
  T extends Class<any>,
  V = ConstructorParameters<T>[number],
  Interfaces = TokenMap[Tokens[number]],
  InferredTokens = V extends Interfaces
    ? KeyByValueType<TokenMap, V>
    : Class<V>,
  Length = UnionToTuple<InferredTokens>['length'],
> = FixedLengthArray<
  InferredTokens,
  // We always have numbers, but TS doesn't know that.
  Length extends number ? Length : never,
  [...InferredTokens[]]
>;

export function generateProvider<
  T extends Class<any>,
  TokenMap extends Record<string, any>,
  Tokens extends readonly string[],
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
): FactoryProvider<T>;
export function generateProvider<
  T extends Class<any>,
  TokenMap extends Record<string, any>,
  Tokens extends readonly string[],
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
  providedToken?: string,
): FactoryProvider<T>;
export function generateProvider<
  T extends Class<any>,
  TokenMap extends Record<string, any>,
  Tokens extends readonly string[],
>(
  targetClass: T,
  injectedTokens: InjectedTokens<TokenMap, Tokens, T>,
  providedToken?: string,
): FactoryProvider<T> {
  return {
    provide: providedToken || targetClass,
    useFactory: (
      ...args: InjectedParameters<TokenMap, ConstructorParameters<T>>
    ) => new targetClass(...args),
    // Cast because we enforce type safety with FixedLengthArray
    // but a mutable array is expected by Nest.
    // I don't a use case with tokens mutation here.
    inject: injectedTokens as unknown as InjectionToken[],
  };
}
