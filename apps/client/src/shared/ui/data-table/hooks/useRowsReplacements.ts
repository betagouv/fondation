import { useState } from 'react';

/** counts the times the rows were replaced, by a search, a filter or a sort, rather than extended by a next page */
export function useRowsReplacements(rowIds: readonly string[]): number {
  const [previousRowIds, setPreviousRowIds] = useState(rowIds);
  const [replacements, setReplacements] = useState(0);

  // a query that keeps no data while loading goes through no rows: those after replace those before
  const extended =
    previousRowIds.length > 0
      ? previousRowIds.every((id, index) => id === rowIds[index])
      : replacements === 0 || rowIds.length === 0;
  if (!extended || previousRowIds.length !== rowIds.length) {
    setPreviousRowIds(rowIds);
    if (!extended) setReplacements((count) => count + 1);
  }

  return replacements;
}
