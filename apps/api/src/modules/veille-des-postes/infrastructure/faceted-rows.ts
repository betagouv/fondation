export type FacetValues<Row, Key extends string> = Record<Key, (row: Row) => readonly string[]>;

/**
 * the rows matching every facet, and for each facet its values counted under the other facets, not under its
 * own: the values of a facet may depend on what the others ask, so they are built again without the counted one
 */
export function facetedRows<Row, Key extends string>(
  rows: readonly Row[],
  asked: Record<Key, readonly string[]>,
  valuesOf: (asked: Record<Key, readonly string[]>) => FacetValues<Row, Key>,
): { counts: Record<Key, Map<string, number>>; matching: Row[] } {
  const keys = Object.keys(asked) as Key[];
  const matchesAll = (row: Row, values: FacetValues<Row, Key>, except?: Key) =>
    keys.every(
      (key) =>
        key === except ||
        asked[key].length === 0 ||
        values[key](row).some((value) => asked[key].includes(value)),
    );

  const counts = Object.fromEntries(
    keys.map((key) => {
      const values = valuesOf({ ...asked, [key]: [] });
      const counted = new Map<string, number>();
      for (const row of rows.filter((row) => matchesAll(row, values, key))) {
        for (const value of values[key](row)) counted.set(value, (counted.get(value) ?? 0) + 1);
      }
      return [key, counted];
    }),
  ) as Record<Key, Map<string, number>>;

  const values = valuesOf(asked);
  return { counts, matching: rows.filter((row) => matchesAll(row, values)) };
}
