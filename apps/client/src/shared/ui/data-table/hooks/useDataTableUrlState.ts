import type { ColumnFiltersState, SortingState, TableState } from '@tanstack/react-table';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import React from 'react';

import { parseAsFilters } from './data-table-parsers';
import type { DataTableState } from './data-table-state';

function omitEmptyFilters(filters: readonly { id: string; value: unknown }[]) {
  return filters.filter(({ value }) => {
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;

    return true;
  });
}

/**
 * keeps the filters, the sorting and the search of a table in the address, so a link reopens the same
 * list, with [nuqs](https://nuqs.dev):
 * ```
 * ?sortBy=firstName&desc=true&filters=formations:["COMMUN"]&q=Pierre+Bourdieu
 * ```
 * Any other part of the state stays in memory.
 */
export function useDataTableUrlState<State extends Partial<DataTableState<string>>>(
  initialState: State = {} as State,
): {
  onColumnFiltersChange: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>;
  setTableState: React.Dispatch<React.SetStateAction<TableState>>;
  tableState: State;
} {
  const { columnFilters, globalFilter, sorting, ...initialMemoryState } = initialState;

  const [memoryState, setMemoryState] = React.useState(initialMemoryState);
  const [queryState, setQueryState] = useQueryStates({
    desc: parseAsBoolean.withDefault(sorting?.[0]?.desc ?? false),
    filters: parseAsFilters.withDefault(columnFilters ?? []),
    q: parseAsString.withDefault(globalFilter ?? ''),
    sortBy: parseAsString.withDefault(sorting?.[0]?.id ?? ''),
  });

  const tableState = React.useMemo(
    () =>
      ({
        columnFilters: queryState.filters ?? [],
        globalFilter: queryState.q,
        sorting:
          (queryState.sortBy?.length ?? 0) > 0
            ? [{ desc: queryState.desc ?? false, id: queryState.sortBy ?? '' }]
            : [],
        ...memoryState,
      }) as State,
    [memoryState, queryState],
  );

  const setState = React.useCallback(
    (updater: ((s: State) => State) | State) => {
      const {
        columnFilters: newColumnFilters,
        globalFilter: newGlobalFilter,
        sorting: newSorting,
        ...newMemoryState
      } = typeof updater === 'function' ? updater(tableState) : updater;

      setMemoryState((previous) => ({ ...previous, ...newMemoryState }));
      setQueryState({
        desc: newSorting?.[0]?.desc ?? false,
        filters: omitEmptyFilters(newColumnFilters ?? []),
        q: (newGlobalFilter ?? '').trim(),
        sortBy: newSorting?.[0]?.id ?? '',
      });
    },
    [setMemoryState, setQueryState, tableState],
  );

  const onSortingChange = React.useCallback(
    (updater: React.SetStateAction<SortingState>) =>
      setState((state) => ({
        ...state,
        sorting: typeof updater === 'function' ? updater(state.sorting ?? []) : updater,
      })),
    [setState],
  );

  const onColumnFiltersChange = React.useCallback(
    (updater: React.SetStateAction<ColumnFiltersState>) =>
      setState((state) => ({
        ...state,
        columnFilters: typeof updater === 'function' ? updater(state.columnFilters ?? []) : updater,
      })),
    [setState],
  );

  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  return { onColumnFiltersChange, onSortingChange, setTableState: setState as any, tableState };
}
