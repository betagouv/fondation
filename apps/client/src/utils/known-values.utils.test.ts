import { describe, expect, it } from 'vitest';

import { knownValues } from './known-values.utils';

const KNOWN = { OCCUPIED: true, VACANT: true } as const;

describe('knownValues', () => {
  it('keeps only the known ids of an array', () => {
    expect(knownValues(['VACANT', 'toString', 1, 'UNKNOWN'], KNOWN)).toEqual(['VACANT']);
    expect(knownValues('VACANT', KNOWN)).toEqual([]);
  });
});
