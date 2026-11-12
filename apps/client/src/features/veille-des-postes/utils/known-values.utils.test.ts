import { describe, expect, it } from 'vitest';

import { KNOWN_STATUSES, knownValues } from './known-values.utils';

describe('knownValues', () => {
  it('keeps only the known ids of an array', () => {
    expect(knownValues(['VACANT', 'toString', 1, 'UNKNOWN'], KNOWN_STATUSES)).toEqual(['VACANT']);
    expect(knownValues('VACANT', KNOWN_STATUSES)).toEqual([]);
  });
});
