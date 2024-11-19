import { FactoryProvider, InjectionToken } from '@nestjs/common';
import 'reflect-metadata';
import { Class } from 'type-fest';

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
  V extends TokenMap[Tokens[number]] | InstanceType<Class<any>>,
> = V extends TokenMap[Tokens[number]] ? KeyByValueType<TokenMap, V> : Class<V>;

export function generateProvider<
  T extends Class<any>,
  TokenMap extends Record<string, any>,
  Tokens extends readonly string[],
>(
  targetClass: T,
  injectedTokens: InjectedTokens<
    TokenMap,
    Tokens,
    ConstructorParameters<T>[number]
  >[],
): FactoryProvider<T>;
export function generateProvider<
  T extends Class<any>,
  TokenMap extends Record<string, any>,
  Tokens extends readonly string[],
>(
  targetClass: T,
  injectedTokens: InjectedTokens<
    TokenMap,
    Tokens,
    ConstructorParameters<T>[number]
  >[],
  providedToken?: string,
): FactoryProvider<T>;
export function generateProvider<
  T extends Class<any>,
  TokenMap extends Record<string, any>,
  Tokens extends readonly string[],
>(
  targetClass: T,
  injectedTokens: InjectedTokens<
    TokenMap,
    Tokens,
    ConstructorParameters<T>[number]
  >[],
  providedToken?: string,
): FactoryProvider<T> {
  return {
    provide: providedToken || targetClass,
    useFactory: (
      ...args: InjectedParameters<TokenMap, ConstructorParameters<T>>
    ) => new targetClass(...args),
    inject: injectedTokens as InjectionToken[],
  };
}
