import { describe, expect, it } from 'vitest';

import { sameValuesIgnoringOrder } from './use-affectation.hook';

describe('sameValuesIgnoringOrder', () => {
  it('treats equal sets regardless of order', () => {
    expect(sameValuesIgnoringOrder(['a', 'b'], ['b', 'a'])).toBe(true);
  });

  it('detects a different length', () => {
    expect(sameValuesIgnoringOrder(['a'], ['a', 'b'])).toBe(false);
  });

  it('detects a different member', () => {
    expect(sameValuesIgnoringOrder(['a', 'b'], ['a', 'c'])).toBe(false);
  });

  it('considers two empty lists equal', () => {
    expect(sameValuesIgnoringOrder([], [])).toBe(true);
  });

  it('matches duplicates that collapse to the same set of the same length', () => {
    expect(sameValuesIgnoringOrder(['a', 'a'], ['a', 'a'])).toBe(true);
  });
});
