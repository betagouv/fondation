import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';

import { useEditedPosition } from '../hooks/useEditedPosition';
import { KNOWN_ALERTS, KNOWN_DEADLINES, KNOWN_STATUSES } from '../utils/known-values.utils';
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
  loadFailureOf,
  useDataTableSearch,
  useDataTableUrlState,
} from '@/shared/ui/data-table';
import { SearchInput } from '@/shared/ui/search-input';
import { formatDateOnly } from '@/utils/date-only.util';
import { knownValues } from '@/utils/known-values.utils';
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
import { type EditedPosition, PositionVacancySidePanel } from './PositionVacancySidePanel';

const SORTABLE_COLUMNS = new Set<string>([
  'installationDate',
  'name',
  'status',
] satisfies CourtOfCassationHoldersSorting[number]['id'][]);

const NO_POSITIONS: CourtOfCassationPositionCount[] = [];

const COLUMNS_BESIDE_SIDE_PANEL = { candidates: false, status: false };

const h = createColumnHelper<CourtOfCassationHolder>();

function editedPositionOf(row: CourtOfCassationHolder): EditedPosition {
  return {
    alerts: row.alerts,
    commented: { magistratId: row.magistrat.id },
    courtLabel: null,
    id: row.magistrat.id,
    installationDate: row.installationDate,
    magistrat: row.magistrat,
    status: row.status,
  };
}

function useCourtOfCassationHoldersColumns(props: {
  onMagistratOpened: (event: MouseEvent, magistratId: string) => void;
  onPositionEdited: (row: CourtOfCassationHolder) => void;
  statusAndAlertCounts: StatusAndAlertCounts;
}) {
  const { formatMessage } = useIntl();
  const { onMagistratOpened, onPositionEdited, statusAndAlertCounts } = props;

  return useMemo(
    () => [
      h.accessor('magistrat', {
        cell: ({ getValue, row }) => (
          <div className="flex flex-col items-start gap-1 leading-6">
            <MagistratLink
              commentPreview={getValue().commentPreview}
              isFormerHolder={row.original.status.id === 'VACANT'}
              magistrat={getValue()}
              onClick={onMagistratOpened}
            />
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
        cell: ({ getValue, row }) => (
          <PositionStatusCell
            alerts={row.original.alerts}
            edit={{
              label: formatMessage({ defaultMessage: 'Modifier le statut' }),
              onClick: () => onPositionEdited(row.original),
            }}
            status={getValue()}
          />
        ),
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
    [formatMessage, onMagistratOpened, onPositionEdited, statusAndAlertCounts],
  );
}

export function CourtOfCassationHoldersTable(props: {
  filtersSlot: HTMLDivElement | null;
  onSidePanelToggle: (open: boolean) => void;
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

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
    isPlaceholderData,
    refetch,
  } = useCourtOfCassationHoldersQuery({
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
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError]);

  const statusAndAlertCounts = useMemo(
    () =>
      holders
        ? { alerts: holders.alerts, deadlines: holders.deadlines, statuses: holders.statuses }
        : NO_STATUS_AND_ALERT_COUNTS,
    [holders],
  );
  const items = useMemo(() => holders?.items ?? [], [holders]);
  const editing = useEditedPosition(items, editedPositionOf, props.onSidePanelToggle);
  // the row of the side panel or the one left for a magistrat's page
  const highlightedRowId = editing.edited?.id ?? revealedRowId;
  const table = useReactTable({
    columns: useCourtOfCassationHoldersColumns({
      onMagistratOpened: remember,
      onPositionEdited: editing.open,
      statusAndAlertCounts,
    }),
    data: items,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.magistrat.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onSortingChange,
    state: {
      columnFilters: tableState.columnFilters,
      columnVisibility: editing.edited ? COLUMNS_BESIDE_SIDE_PANEL : {},
      globalFilter: tableState.globalFilter,
      sorting,
    },
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
      <div
        className={clsx('w-full transition-[width] duration-300 ease-out', editing.edited && 'md:w-[52%]')}
      >
        {props.positionTabs(
          // only the current tab beside the side panel, like the tabs of the page
          editing.edited ? positions.filter(({ id }) => id === props.position) : positions,
        )}
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
          isLoading={!isError && (isLoading || !holders)}
          loadError={loadFailureOf({ fetchNextPage, isError, isFetching, isFetchNextPageError, refetch })}
          onEndReached={fetchMore}
          onSeenRowsChange={onSeenRowsChange}
          revealedRowId={highlightedRowId}
          rowTint={(row) =>
            clsx(VEILLE_ROW_CLASS, row.id === highlightedRowId && 'bg-(--background-alt-blue-france)')
          }
          scrollsWithPage
          table={table}
        />
      </div>
      <PositionVacancySidePanel
        edited={editing.edited}
        isLeaveBlocked={editing.isLeaveBlocked}
        onClose={editing.close}
        onLeaveBlockedChange={editing.setLeaveBlocked}
        onNext={editing.next}
        onPrevious={editing.previous}
      />
    </>
  );
}
