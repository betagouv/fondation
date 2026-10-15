import {
  getCoreRowModel,
  useReactTable,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
  type TableOptions,
  type VisibilityState,
} from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';

import type { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';
import type { PrioriteEnum } from '@/shared/enums/priorite.enum';
import { useDataTableSearch, useDataTableUrlState } from '@/shared/ui/data-table';
import {
  useInfiniteSessionNominationFilesQuery,
  type SessionNominationFile,
  type SessionNominationFilesFilters,
} from '@queries/nomination-sessions.queries';

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
  const { onColumnFiltersChange, onSortingChange, setTableState, tableState } = useDataTableUrlState({
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

  const search = useDataTableSearch(tableState.globalFilter ?? '', (globalFilter) =>
    setTableState((state) => ({ ...state, globalFilter })),
  );

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
    clearSearch: search.clear,
    fetchNextPage: fetchNextFilesPage,
    isFetching,
    isFiltered: !!tableState.globalFilter || tableState.columnFilters.some(({ value }) => value.length),
    isLoading,
    nominationFiles,
    onSearchChange: search.onChange,
    search: search.value,
    table,
    totalCount: data?.totalCount ?? 0,
  };
}
