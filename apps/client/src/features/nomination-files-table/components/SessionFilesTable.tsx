import {
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table,
  type TableOptions,
} from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState, type PropsWithChildren, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';
import { useDebouncedCallback } from 'use-debounce';

import { useNominationFilesTable } from '../context/files-table.context';
import { ReactTableFilterColumn, useQueryDataTableState } from '@/shared/ui/data-table';
import { NewTable } from '@/shared/ui/new-table';
import { SearchInput } from '@/shared/ui/search-input';
import type { NominationFileOutcomeEnum, PrioriteEnum } from '@/types/enums.types';
import {
  useInfiniteSessionNominationFilesQuery,
  type SessionNominationFile,
  type SessionNominationFilesFilters,
} from '@queries/nomination-sessions.queries';

import { AddNominationFileAttachmentModalProvider } from './cells/magistrat-side-panel/components/attachments/context/AddNominationFileAttachmentModalProvider';
import { MagistratSidePanel } from './cells/magistrat-side-panel/components/MagistratSidePanel';
import { useSidePanel } from './cells/magistrat-side-panel/context/side-panel.context';
import { SidePanelProvider } from './cells/magistrat-side-panel/context/SidePanelProvider';
import { useOutOfListFile } from './cells/magistrat-side-panel/hooks/use-out-of-list-file/use-out-of-list-file.hook';
import { NominationFileOutcomeCommentModalProvider } from './cells/nomination-file-outcome/NominationFileOutcomeCommentModalProvider';
import { ObservationsModalProvider } from './cells/observations/context/ObservationsModalProvider';
import { NominationFileTargetPositionProvider } from './cells/targeted-position/NominationFileTargetPositionProvider';

function SessionFilesNewTable(props: {
  emptyLabel: string;
  isLoading: boolean;
  onEndReached: () => void;
  table: Table<SessionNominationFile>;
}) {
  const { activeId } = useSidePanel();
  const intl = useIntl();
  const isEmpty = !props.isLoading && props.table.getRowModel().rows.length === 0;

  return (
    <NewTable
      ariaLabel={intl.formatMessage({ defaultMessage: 'Dossiers de la session' })}
      className={isEmpty ? undefined : 'max-h-screen'}
      emptyLabel={
        props.isLoading ? intl.formatMessage({ defaultMessage: 'Chargement...' }) : props.emptyLabel
      }
      fluid
      isLoading={props.isLoading}
      onEndReached={props.onEndReached}
      revealedRowId={activeId}
      rowTint={(row) => (row.id === activeId ? 'bg-(--background-alt-blue-france)' : undefined)}
      table={props.table}
      visibleRows={10}
    />
  );
}

export function SessionFilesTable(
  props: PropsWithChildren<{
    canSelectRow?: (row: Row<SessionNominationFile>) => boolean;
    columns: TableOptions<SessionNominationFile>['columns'];
    emptyLabel?: string;
    filtersEnd?: ReactNode;
    filtersSlot?: Element | null;
    onRowSelectionChange?: OnChangeFn<RowSelectionState>;
    restrictTo?: SessionNominationFilesFilters;
    rowSelection?: RowSelectionState;
    summary?: (session: { totalCount: number }) => ReactNode;
  }>,
) {
  const intl = useIntl();
  const { sessionId } = useNominationFilesTable();
  const [tableState, setTableState] = useQueryDataTableState({
    globalFilter: '',
    sorting: [] as [] | [{ id: 'fileNumber' | 'name' | 'targetedGrade' | 'targetedPosition'; desc: boolean }],
    columnFilters: [] as { id: 'priorities' | 'reporters' | 'outcomes'; value: string[] }[],
  });

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading } =
    useInfiniteSessionNominationFilesQuery({
      sessionId,
      sorting: tableState.sorting,
      filters: {
        search: tableState.globalFilter,
        priorities: tableState.columnFilters.find(({ id }) => id === 'priorities')?.value as PrioriteEnum[],
        reporterIds: tableState.columnFilters.find(({ id }) => id === 'reporters')?.value as string[],
        outcomes: tableState.columnFilters.find(({ id }) => id === 'outcomes')
          ?.value as (NominationFileOutcomeEnum | null)[],
        ...props.restrictTo,
      },
    });
  const nominationFiles = useMemo(() => data?.items ?? [], [data]);

  const fetchNextFilesPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const outOfList = useOutOfListFile({
    fetchNextPage: fetchNextFilesPage,
    isFiltered: !!tableState.globalFilter || tableState.columnFilters.some(({ value }) => value.length),
    isListPending: isLoading,
    nominationFiles,
    sessionId,
  });

  const onSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) =>
      setTableState((state) => ({
        ...state,
        sorting: typeof updater === 'function' ? updater(state.sorting) : updater,
      })),
    [setTableState],
  );

  const [search, setSearch] = useState(tableState.globalFilter ?? '');
  const updateGlobalFilter = useDebouncedCallback(
    (globalFilter: string) => setTableState((state) => ({ ...state, globalFilter })),
    600,
  );
  useEffect(() => {
    if (!updateGlobalFilter.isPending()) setSearch(tableState.globalFilter ?? '');
  }, [tableState.globalFilter, updateGlobalFilter]);
  const clearSearch = () => {
    updateGlobalFilter.cancel();
    setSearch('');
    setTableState((state) => ({ ...state, globalFilter: '' }));
  };

  const onColumnFiltersChange = useCallback(
    (updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) =>
      setTableState((state) => ({
        ...state,
        columnFilters: typeof updater === 'function' ? updater(state.columnFilters) : updater,
      })),
    [setTableState],
  );

  const table = useReactTable({
    columns: props.columns,
    data: nominationFiles,
    enableRowSelection: props.canSelectRow ?? !!props.onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onRowSelectionChange: props.onRowSelectionChange,
    onSortingChange,
    state: {
      columnFilters: tableState.columnFilters,
      rowSelection: props.rowSelection ?? {},
      sorting: tableState.sorting,
    },
  });

  const filters = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <ReactTableFilterColumn table={table} />
        {props.filtersEnd}
      </div>
      <SearchInput
        className="w-72"
        onChange={(value) => {
          setSearch(value);
          updateGlobalFilter(value);
        }}
        onClear={clearSearch}
        placeholder={intl.formatMessage({ defaultMessage: 'Rechercher un magistrat' })}
        value={search}
      />
    </div>
  );

  return (
    <ObservationsModalProvider>
      <SidePanelProvider
        isFetching={isFetching}
        isResolvingOutOfListFile={outOfList.isResolving}
        nominationFiles={nominationFiles}
        onEndReached={fetchNextFilesPage}
        outOfListFile={outOfList.file}
        totalCount={data?.totalCount ?? 0}
      >
        <NominationFileOutcomeCommentModalProvider>
          <NominationFileTargetPositionProvider sessionId={sessionId}>
            <AddNominationFileAttachmentModalProvider>
              <MagistratSidePanel sessionId={sessionId} />
              <div className="flex flex-col gap-y-4">
                {props.filtersSlot ? createPortal(filters, props.filtersSlot) : filters}

                <div className="flex min-h-10 flex-col justify-center">
                  {props.summary?.({ totalCount: data?.totalCount ?? 0 })}
                  {props.children}
                </div>
                <SessionFilesNewTable
                  emptyLabel={
                    props.emptyLabel ??
                    intl.formatMessage({
                      defaultMessage: 'Aucun résultat ne correspond aux valeurs filtrées',
                    })
                  }
                  isLoading={isLoading}
                  onEndReached={fetchNextFilesPage}
                  table={table}
                />
              </div>
            </AddNominationFileAttachmentModalProvider>
          </NominationFileTargetPositionProvider>
        </NominationFileOutcomeCommentModalProvider>
      </SidePanelProvider>
    </ObservationsModalProvider>
  );
}
