import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';

import { KNOWN_ALERTS, KNOWN_DEADLINES, KNOWN_STATUSES, knownValues } from '../utils/known-values.utils';
import {
  NO_STATUS_AND_ALERT_COUNTS,
  type StatusAndAlertCounts,
  statusAndAlertFilters,
} from '../utils/status-and-alert-filters.utils';
import { VEILLE_ROW_CLASS } from '../utils/veille-row.utils';
import { useRowRevealedOnReturn } from '@/shared/hooks/useRowRevealedOnReturn';
import {
  DataTable,
  DataTableCount,
  DataTableFilters,
  useDataTableSearch,
  useDataTableUrlState,
} from '@/shared/ui/data-table';
import { SearchInput } from '@/shared/ui/search-input';
import { formatDateOnly } from '@/utils/date-only.util';
import {
  type AlertDeadline,
  type CourtOfCassationHolder,
  type CourtOfCassationHoldersSorting,
  type CourtOfCassationPosition,
  type CourtOfCassationPositionCount,
  type PositionAlert,
  type PositionStatus,
  COURT_OF_CASSATION_HOLDERS_DEFAULT_SORTING,
  COURT_OF_CASSATION_HOLDERS_PAGE_SIZE,
  useCourtOfCassationHoldersQuery,
} from '@queries/veille-des-postes.queries';

import { MagistratLink } from './MagistratLink';
import { PositionStatusCell } from './PositionStatusCell';

const SORTABLE_COLUMNS = new Set<string>([
  'installationDate',
  'name',
  'status',
] satisfies CourtOfCassationHoldersSorting[number]['id'][]);

const NO_POSITIONS: CourtOfCassationPositionCount[] = [];

const h = createColumnHelper<CourtOfCassationHolder>();

function useCourtOfCassationHoldersColumns(props: {
  onMagistratOpened: (event: MouseEvent, magistratId: string) => void;
  statusAndAlertCounts: StatusAndAlertCounts;
}) {
  const { formatMessage } = useIntl();
  const { onMagistratOpened, statusAndAlertCounts } = props;

  return useMemo(
    () => [
      h.accessor('magistrat', {
        cell: ({ getValue, row }) => (
          <div className="flex flex-col items-start gap-1 leading-6">
            <MagistratLink magistrat={getValue()} onClick={onMagistratOpened} />
            {row.original.service.id === 'EXTRAORDINARY' && (
              <span className="text-xs leading-6">{row.original.service.label}</span>
            )}
          </div>
        ),
        header: formatMessage({ defaultMessage: 'Magistrat' }),
        id: 'name',
        size: 280,
        sortDescFirst: false,
      }),
      h.accessor('installationDate', {
        cell: ({ getValue }) => {
          const installationDate = getValue();
          return installationDate ? formatDateOnly(installationDate) : '-';
        },
        header: formatMessage({ defaultMessage: "Date d'installation" }),
        id: 'installationDate',
        size: 180,
        sortDescFirst: false,
      }),
      h.accessor('status', {
        cell: ({ getValue, row }) => <PositionStatusCell alerts={row.original.alerts} status={getValue()} />,
        header: formatMessage({ defaultMessage: 'Alerte / statut' }),
        id: 'status',
        meta: { filters: statusAndAlertFilters(formatMessage, statusAndAlertCounts) },
        size: 240,
        sortDescFirst: false,
      }),
      h.display({
        cell: () => '-',
        header: formatMessage({ defaultMessage: 'Candidats' }),
        id: 'candidates',
        size: 160,
      }),
    ],
    [formatMessage, onMagistratOpened, statusAndAlertCounts],
  );
}

export function CourtOfCassationHoldersTable(props: {
  filtersSlot: HTMLDivElement | null;
  position: CourtOfCassationPosition;
  /** the tabs of the positions, counted under the search and the filters of the table */
  positionTabs: (positions: CourtOfCassationPositionCount[]) => ReactNode;
  titleSlot: HTMLSpanElement | null;
}) {
  const { formatMessage } = useIntl();
  // rounded to a page, so that scrolling within a page renders nothing new
  const [seenRows, setSeenRows] = useState(0);
  const onSeenRowsChange = useCallback(
    (rows: number) =>
      setSeenRows(
        Math.ceil(rows / COURT_OF_CASSATION_HOLDERS_PAGE_SIZE) * COURT_OF_CASSATION_HOLDERS_PAGE_SIZE,
      ),
    [],
  );
  const { remember, revealedRowId } = useRowRevealedOnReturn();

  const { onColumnFiltersChange, onSortingChange, setTableState, tableState } = useDataTableUrlState({
    columnFilters: [] as (
      | { id: 'alert'; value: PositionAlert[] }
      | { id: 'deadline'; value: AlertDeadline[] }
      | { id: 'status'; value: PositionStatus[] }
    )[],
    globalFilter: '',
    sorting: COURT_OF_CASSATION_HOLDERS_DEFAULT_SORTING,
  });

  // a saved link can carry a sort the API no longer accepts
  const [sort] = tableState.sorting;
  const sorting =
    sort && SORTABLE_COLUMNS.has(sort.id) ? tableState.sorting : COURT_OF_CASSATION_HOLDERS_DEFAULT_SORTING;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isPlaceholderData } =
    useCourtOfCassationHoldersQuery({
      alerts: knownValues(
        tableState.columnFilters.find((filter) => filter.id === 'alert')?.value,
        KNOWN_ALERTS,
      ),
      deadlines: knownValues(
        tableState.columnFilters.find((filter) => filter.id === 'deadline')?.value,
        KNOWN_DEADLINES,
      ),
      positions: [props.position],
      search: tableState.globalFilter,
      sorting,
      statuses: knownValues(
        tableState.columnFilters.find((filter) => filter.id === 'status')?.value,
        KNOWN_STATUSES,
      ),
    });

  // the rows of the previous position stay as placeholder until those of the new one arrive
  const [loadedPosition, setLoadedPosition] = useState(props.position);
  if (!isPlaceholderData && loadedPosition !== props.position) setLoadedPosition(props.position);
  const holders = loadedPosition === props.position ? data : undefined;

  const search = useDataTableSearch(tableState.globalFilter, (globalFilter) =>
    setTableState((state) => ({ ...state, globalFilter })),
  );

  // counted under the search and the filters, whatever the position
  const positions = data?.positions ?? NO_POSITIONS;

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const statusAndAlertCounts = useMemo(
    () =>
      holders
        ? { alerts: holders.alerts, deadlines: holders.deadlines, statuses: holders.statuses }
        : NO_STATUS_AND_ALERT_COUNTS,
    [holders],
  );
  const table = useReactTable({
    columns: useCourtOfCassationHoldersColumns({
      onMagistratOpened: remember,
      statusAndAlertCounts,
    }),
    data: useMemo(() => holders?.items ?? [], [holders]),
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.magistrat.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onSortingChange,
    state: { columnFilters: tableState.columnFilters, globalFilter: tableState.globalFilter, sorting },
  });

  return (
    <>
      {props.titleSlot &&
        holders &&
        createPortal(<DataTableCount loaded={seenRows} total={holders.totalCount} />, props.titleSlot)}
      {props.filtersSlot &&
        createPortal(
          <div className="flex items-center justify-between gap-4">
            <DataTableFilters table={table} />
            <SearchInput
              className="w-72"
              onChange={search.onChange}
              onClear={search.clear}
              placeholder={formatMessage({ defaultMessage: 'Rechercher un magistrat' })}
              value={search.value}
            />
          </div>,
          props.filtersSlot,
        )}
      {props.positionTabs(positions)}
      <DataTable
        ariaLabel={formatMessage(
          { defaultMessage: '{position} de la Cour de cassation' },
          { position: positions.find(({ id }) => id === props.position)?.label },
        )}
        emptyLabel={
          tableState.globalFilter || tableState.columnFilters.length
            ? formatMessage({ defaultMessage: 'Aucun magistrat ne correspond aux filtres fournis' })
            : formatMessage({ defaultMessage: 'Aucun magistrat à ce poste' })
        }
        fluid
        isLoading={isLoading || !holders}
        onEndReached={fetchMore}
        onSeenRowsChange={onSeenRowsChange}
        revealedRowId={revealedRowId}
        rowTint={(row) =>
          clsx(VEILLE_ROW_CLASS, row.id === revealedRowId && 'bg-(--background-alt-blue-france)')
        }
        scrollsWithPage
        table={table}
      />
    </>
  );
}
