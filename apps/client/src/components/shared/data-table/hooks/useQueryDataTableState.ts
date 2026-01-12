import type { TableState } from '@tanstack/react-table';
import { parseAsBoolean, parseAsIndex, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import React from 'react';

import { assertIsPageSize } from './assert-is-page-size';
import { parseAsFilters } from './data-table-parsers';
import type { DataTableState } from './data-table-state';

/** @warning this method might be too opinionated, assuming that default sorting state is always empty */
function omitEmptyFilters(filters: readonly { id: string; value: unknown }[]) {
  return filters.filter(({ value }) => {
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;

    return true;
  });
}

/**
 * synchronizes the table state with the URL using [?n=u&q=s](https://nuqs.dev).
 *
 * Note that NOT ALL the table state is synchronized to the URL, only:
 *
 * - pagination
 * - sorting
 * - columnFilters
 * - globalFilter (only string search is supported ATM)
 *
 * Here is what the query string should look like:
 * ```
 * ?page=2&perPage=100&sortBy=firstName&desc=true&filters=formations:["COMMUN"]&q=Pierre+Bourdieu
 * ```
 */
export function useQueryDataTableState<State extends Partial<DataTableState<string>>>(
  initialState: State = {} as State
): [State, React.Dispatch<React.SetStateAction<TableState>>] {
  assertIsPageSize(initialState.pagination?.pageSize);

  const { pagination, sorting, columnFilters, globalFilter, ...initialNonQueryState } = initialState;

  const [nonQueryState, setNonQueryState] = React.useState(initialNonQueryState);
  const [queryState, setQueryState] = useQueryStates({
    sortBy: parseAsString.withDefault(sorting?.[0]?.id ?? ''),
    desc: parseAsBoolean.withDefault(sorting?.[0]?.desc ?? false),
    page: parseAsIndex.withDefault(pagination?.pageIndex ?? 0),
    perPage: parseAsInteger.withDefault(pagination?.pageSize ?? 50),
    filters: parseAsFilters.withDefault(columnFilters ?? []),
    q: parseAsString.withDefault(globalFilter ?? '')
  });

  const tableState = React.useMemo(
    () =>
      ({
        pagination: { pageIndex: queryState.page, pageSize: queryState.perPage },
        sorting:
          (queryState.sortBy?.length ?? 0) > 0
            ? [{ id: queryState.sortBy ?? '', desc: queryState.desc ?? false }]
            : [],
        columnFilters: queryState.filters ?? [],
        globalFilter: queryState.q,
        ...nonQueryState
      }) as State,
    [queryState, nonQueryState]
  );

  const setState = React.useCallback(
    (updater: ((s: State) => State) | State) => {
      const {
        pagination: newPagination,
        sorting: newSorting,
        columnFilters: newColumnFilters,
        globalFilter: newGlobalFilter,
        ...newNonQueryState
      } = typeof updater === 'function' ? updater(tableState) : updater;

      setQueryState({
        desc: newSorting?.[0]?.desc ?? false,
        sortBy: newSorting?.[0]?.id ?? '',
        page: newPagination?.pageIndex,
        perPage: newPagination?.pageSize,
        filters: omitEmptyFilters(newColumnFilters ?? []),
        q: (newGlobalFilter ?? '').trim()
      });

      setNonQueryState(newNonQueryState);
    },
    [tableState, setQueryState, setNonQueryState]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return [tableState, setState] as any;
}
