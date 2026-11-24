import z from 'zod';

/** a single value in the query string comes as a string rather than an array */
export function listOf<T extends z.ZodType>(item: T) {
  return z.preprocess((x) => (x ? ([] as unknown[]).concat(x) : x), z.array(item).optional());
}
