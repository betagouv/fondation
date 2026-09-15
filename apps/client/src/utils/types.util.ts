export function assertNever(value: never, message?: string): never {
  throw new Error(message || `Unexpected value ${String(value)}`);
}
type Pretty<T> = {
  [K in keyof T]: T[K];
} & {};

export type Override<T, U extends Partial<Record<keyof T, unknown>>> = Pretty<
  { [K in keyof T as Exclude<K, keyof U>]: T[K] } & { [K in keyof U]: U[K] }
>;
