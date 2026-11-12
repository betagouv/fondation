import { describe, expect, it } from 'vitest';

import { parseAsFilters } from './data-table-parsers';

describe('parseAsFilters', () => {
  it('reads back several filters holding several values', () => {
    const filters = [
      { id: 'position', value: ['COUNSELLOR', 'FIRST_PRESIDENT'] },
      { id: 'status', value: ['OCCUPIED'] },
    ];

    expect(parseAsFilters.parse(parseAsFilters.serialize(filters))).toEqual(filters);
  });

  it('keeps a comma written inside a value', () => {
    const filters = [{ id: 'jurisdiction', value: ['TJ de Paris, chambre 2'] }];

    expect(parseAsFilters.parse(parseAsFilters.serialize(filters))).toEqual(filters);
  });

  it('drops a malformed filter but keeps the others', () => {
    expect(parseAsFilters.parse('position:["COUNSELLOR",status:["OCCUPIED"]')).toEqual([]);
    expect(parseAsFilters.parse('position:[oops],status:["OCCUPIED"]')).toEqual([
      { id: 'status', value: ['OCCUPIED'] },
    ]);
  });
});
