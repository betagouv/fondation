import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

const SEARCH_DEBOUNCE_MS = 600;

/** what the search field shows while the committed value, the one the list is fetched with, lags behind */
export function useDataTableSearch(value: string, onCommit: (value: string) => void) {
  const [search, setSearch] = useState(value);
  const commit = useDebouncedCallback(onCommit, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (!commit.isPending()) setSearch(value);
  }, [commit, value]);

  return {
    clear: () => {
      commit.cancel();
      setSearch('');
      onCommit('');
    },
    onChange: (next: string) => {
      setSearch(next);
      commit(next);
    },
    value: search,
  };
}
