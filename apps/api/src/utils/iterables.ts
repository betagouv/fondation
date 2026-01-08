export function partition<T, U extends T>(
  iterable: Iterable<T>,
  predicate: (value: T, index: number) => value is U,
): [ok: U[], notOk: Exclude<T, U>[]];

export function partition<T>(
  iterable: Iterable<T>,
  predicate: (value: T, index: number) => boolean,
): [ok: T[], notOk: T[]];

export function partition<T>(
  iterable: Iterable<T>,
  predicate: (value: T, index: number) => boolean,
): [ok: T[], notOk: T[]] {
  const ok: T[] = [];
  const notOk: T[] = [];

  let index = 0;
  for (const value of iterable) {
    if (predicate(value, index++)) ok.push(value);
    else notOk.push(value);
  }
  return [ok, notOk] as const;
}
