import { randomUUID } from 'node:crypto';

const BRAND = Symbol();
export type Id<Brand extends string> = string & { [BRAND]: Brand };

export function makeId<const Brand extends string = string>(_brand?: Brand, existingId?: string): Id<Brand> {
  return (existingId ?? randomUUID()) as Id<Brand>;
}
