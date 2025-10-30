import { inspect } from 'node:util';

export function assertNever(value: never): never {
  throw new Error(`unknown value "${inspect(value)}"`);
}
