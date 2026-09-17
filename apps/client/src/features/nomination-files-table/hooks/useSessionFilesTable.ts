import {
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type VisibilityState,
} from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import type { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';
import type { PrioriteEnum } from '@/shared/enums/priorite.enum';
import { useQueryDataTableState } from '@/shared/ui/data-table';
import {
  useInfiniteSessionNominationFilesQuery,
  type SessionNominationFile,
  type SessionNominationFilesFilters,
} from '@queries/nomination-sessions.queries';

const SEARCH_DEBOUNCE_MS = 600;

export type SessionFilesTableState = ReturnType<typeof useSessionFilesTable>;

export function useSessionFilesTable(options: {
  canSelectRow?: (row: Row<SessionNominationFile>) => boolean;
  columns: TableOptions<SessionNominationFile>['columns'];
  columnVisibility?: VisibilityState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  restrictTo?: SessionNominationFilesFilters;
  rowSelection?: RowSelectionState;
  sessionId: string;
}) {
  const [tableState, setTableState] = useQueryDataTableState({
    globalFilter: '',
    sorting: [] as [] | [{ id: 'fileNumber' | 'name' | 'targetedGrade' | 'targetedPosition'; desc: boolean }],
    columnFilters: [] as { id: 'priorities' | 'reporters' | 'outcomes'; value: string[] }[],
  });

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading } =
    useInfiniteSessionNominationFilesQuery({
      filters: {
        outcomes: tableState.columnFilters.find(({ id }) => id === 'outcomes')
          ?.value as (NominationFileOutcomeEnum | null)[],
        priorities: tableState.columnFilters.find(({ id }) => id === 'priorities')?.value as PrioriteEnum[],
        reporterIds: tableState.columnFilters.find(({ id }) => id === 'reporters')?.value as string[],
        search: tableState.globalFilter,
        ...options.restrictTo,
      },
      sessionId: options.sessionId,
      sorting: tableState.sorting,
    });

  const fetchNextFilesPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const onSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) =>
      setTableState((state) => ({
        ...state,
        sorting: typeof updater === 'function' ? updater(state.sorting) : updater,
      })),
    [setTableState],
  );

  const onColumnFiltersChange = useCallback(
    (updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) =>
      setTableState((state) => ({
        ...state,
        columnFilters: typeof updater === 'function' ? updater(state.columnFilters) : updater,
      })),
    [setTableState],
  );

  const [search, setSearch] = useState(tableState.globalFilter ?? '');
  const updateGlobalFilter = useDebouncedCallback(
    (globalFilter: string) => setTableState((state) => ({ ...state, globalFilter })),
    SEARCH_DEBOUNCE_MS,
  );

  useEffect(() => {
    if (!updateGlobalFilter.isPending()) setSearch(tableState.globalFilter ?? '');
  }, [tableState.globalFilter, updateGlobalFilter]);

  const onSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      updateGlobalFilter(value);
    },
    [updateGlobalFilter],
  );

  const clearSearch = useCallback(() => {
    updateGlobalFilter.cancel();
    setSearch('');
    setTableState((state) => ({ ...state, globalFilter: '' }));
  }, [setTableState, updateGlobalFilter]);

  const nominationFiles = useMemo(() => data?.items ?? [], [data]);

  const table = useReactTable({
    columns: options.columns,
    data: nominationFiles,
    enableRowSelection: options.canSelectRow ?? !!options.onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onRowSelectionChange: options.onRowSelectionChange,
    onSortingChange,
    state: {
      columnFilters: tableState.columnFilters,
      columnVisibility: options.columnVisibility,
      globalFilter: tableState.globalFilter,
      rowSelection: options.rowSelection ?? {},
      sorting: tableState.sorting,
    },
  });

  return {
    clearSearch,
    fetchNextPage: fetchNextFilesPage,
    isFetching,
    isFiltered: !!tableState.globalFilter || tableState.columnFilters.some(({ value }) => value.length),
    isLoading,
    nominationFiles,
    onSearchChange,
    search,
    table,
    totalCount: data?.totalCount ?? 0,
  };
}
