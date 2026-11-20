import { facetedRows } from './faceted-rows';

const ROWS = [
  { color: 'blue', size: 'S' },
  { color: 'blue', size: 'M' },
  { color: 'red', size: 'M' },
];

describe('facetedRows', () => {
  it('keeps the rows matching every facet and counts each facet under the others only', () => {
    const { counts, matching } = facetedRows(ROWS, { color: ['blue'], size: ['M'] }, () => ({
      color: (row) => [row.color],
      size: (row) => [row.size],
    }));

    expect(matching).toEqual([{ color: 'blue', size: 'M' }]);
    expect(Object.fromEntries(counts.color)).toEqual({ blue: 1, red: 1 });
    expect(Object.fromEntries(counts.size)).toEqual({ M: 1, S: 1 });
  });
});
