import { AssertionError } from 'node:assert';
import { inspect } from 'node:util';

export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

export function assertIsDefined<T>(value: T, message?: string): NonNullable<T> {
  if (!isDefined(value)) {
    throw new AssertionError({
      message: message || `expected a non-null value, received: ${inspect(value)}`,
    });
  }

  return value;
}
