import { describe, expect, it } from 'vitest';

import { sameValues } from './use-magistrat-affectation.hook';

describe('sameValues', () => {
  it('treats equal sets regardless of order', () => {
    expect(sameValues(['a', 'b'], ['b', 'a'])).toBe(true);
  });

  it('detects a different length', () => {
    expect(sameValues(['a'], ['a', 'b'])).toBe(false);
  });

  it('detects a different member', () => {
    expect(sameValues(['a', 'b'], ['a', 'c'])).toBe(false);
  });

  it('considers two empty lists equal', () => {
    expect(sameValues([], [])).toBe(true);
  });

  it('matches duplicates that collapse to the same set of the same length', () => {
    expect(sameValues(['a', 'a'], ['a', 'a'])).toBe(true);
  });
});
