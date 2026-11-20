import { describe, expect, it } from 'vitest';

import { rowsInsideRessortGroups } from './ressort-groups.utils';

describe('rowsInsideRessortGroups', () => {
  it('keeps the rows followed by a court of the same ressort', () => {
    const rows = rowsInsideRessortGroups([
      { id: 'agen', ressortId: 'CA AGEN' },
      { id: 'cahors', ressortId: 'CA AGEN' },
      { id: 'lyon', ressortId: 'CA LYON' },
    ]);

    expect([...rows]).toEqual(['agen']);
  });
});
