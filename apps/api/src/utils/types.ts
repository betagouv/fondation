export type Pretty<T> = {
  [K in keyof T]: T[K];
} & {};

export type UnionToIntersection<T> = (
  T extends unknown ? (x: T) => void : never
) extends (x: infer U) => void
  ? U
  : never;
