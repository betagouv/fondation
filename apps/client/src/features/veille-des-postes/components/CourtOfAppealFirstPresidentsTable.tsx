import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useMemo, useState, type MouseEvent } from 'react';
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
  type CourtOfAppealFirstPresident,
  type CourtOfAppealFirstPresidentsSorting,
  type PositionAlert,
  type PositionStatus,
  COURT_OF_APPEAL_FIRST_PRESIDENTS_DEFAULT_SORTING,
  COURT_OF_APPEAL_FIRST_PRESIDENTS_PAGE_SIZE,
  useCourtOfAppealFirstPresidentsQuery,
} from '@queries/veille-des-postes.queries';

import { CommentPreviewIcon, MagistratLink } from './MagistratLink';
import { PositionStatusCell } from './PositionStatusCell';
import { type EditedPosition, PositionVacancySidePanel } from './PositionVacancySidePanel';

const SORTABLE_COLUMNS = new Set<string>([
  'court',
  'installationDate',
  'name',
  'status',
] satisfies CourtOfAppealFirstPresidentsSorting[number]['id'][]);

const COLUMNS_BESIDE_SIDE_PANEL = { candidates: false, installationDate: false, status: false };

const h = createColumnHelper<CourtOfAppealFirstPresident>();

/** a magistrat holds one position only, and a court without one is listed once */
function rowIdOf(firstPresident: CourtOfAppealFirstPresident): string {
  return firstPresident.magistrat?.id ?? firstPresident.court.id;
}

function editedPositionOf(row: CourtOfAppealFirstPresident): EditedPosition {
  return {
    alerts: row.alerts,
    commented: { courtId: row.court.id },
    courtLabel: row.court.label,
    id: rowIdOf(row),
    installationDate: row.installationDate,
    magistrat: row.magistrat,
    status: row.status,
  };
}

function useCourtOfAppealFirstPresidentsColumns(props: {
  onMagistratOpened: (event: MouseEvent, magistratId: string) => void;
  onPositionEdited: (row: CourtOfAppealFirstPresident) => void;
  statusAndAlertCounts: StatusAndAlertCounts;
}) {
  const { formatMessage } = useIntl();
  const { onMagistratOpened, onPositionEdited, statusAndAlertCounts } = props;

  return useMemo(
    () => [
      h.accessor('court.label', {
        cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        header: formatMessage({ defaultMessage: 'Ressort' }),
        id: 'court',
        size: 280,
        sortDescFirst: false,
      }),
      h.accessor('magistrat', {
        cell: ({ getValue, row }) => {
          const magistrat = getValue();
          if (!magistrat) {
            return row.original.commentPreview === null ? (
              '-'
            ) : (
              <CommentPreviewIcon commentPreview={row.original.commentPreview} />
            );
          }
          return (
            <MagistratLink
              commentPreview={row.original.commentPreview}
              isFormerHolder={row.original.status.id === 'VACANT'}
              magistrat={magistrat}
              onClick={onMagistratOpened}
            />
          );
        },
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
              label: row.original.magistrat
                ? formatMessage({ defaultMessage: 'Modifier le statut' })
                : formatMessage({ defaultMessage: 'Commenter le poste' }),
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

export function CourtOfAppealFirstPresidentsTable(props: {
  filtersSlot: HTMLDivElement | null;
  onSidePanelToggle: (open: boolean) => void;
  titleSlot: HTMLSpanElement | null;
}) {
  const { formatMessage } = useIntl();
  // rounded to a page, so that scrolling within a page renders nothing new
  const [seenRows, setSeenRows] = useState(0);
  const onSeenRowsChange = useCallback(
    (rows: number) =>
      setSeenRows(
        Math.ceil(rows / COURT_OF_APPEAL_FIRST_PRESIDENTS_PAGE_SIZE) *
          COURT_OF_APPEAL_FIRST_PRESIDENTS_PAGE_SIZE,
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
    sorting: COURT_OF_APPEAL_FIRST_PRESIDENTS_DEFAULT_SORTING,
  });

  // a saved link can carry a sort the API no longer accepts
  const [sort] = tableState.sorting;
  const sorting =
    sort && SORTABLE_COLUMNS.has(sort.id)
      ? tableState.sorting
      : COURT_OF_APPEAL_FIRST_PRESIDENTS_DEFAULT_SORTING;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
    refetch,
  } = useCourtOfAppealFirstPresidentsQuery({
    alerts: knownValues(
      tableState.columnFilters.find((filter) => filter.id === 'alert')?.value,
      KNOWN_ALERTS,
    ),
    deadlines: knownValues(
      tableState.columnFilters.find((filter) => filter.id === 'deadline')?.value,
      KNOWN_DEADLINES,
    ),
    search: tableState.globalFilter,
    sorting,
    statuses: knownValues(
      tableState.columnFilters.find((filter) => filter.id === 'status')?.value,
      KNOWN_STATUSES,
    ),
  });

  const search = useDataTableSearch(tableState.globalFilter, (globalFilter) =>
    setTableState((state) => ({ ...state, globalFilter })),
  );

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError]);

  const statusAndAlertCounts = useMemo(
    () =>
      data
        ? { alerts: data.alerts, deadlines: data.deadlines, statuses: data.statuses }
        : NO_STATUS_AND_ALERT_COUNTS,
    [data],
  );
  const items = useMemo(() => data?.items ?? [], [data]);
  const editing = useEditedPosition(items, editedPositionOf, props.onSidePanelToggle);
  // the row of the side panel or the one left for a magistrat's page
  const highlightedRowId = editing.edited?.id ?? revealedRowId;
  const table = useReactTable({
    columns: useCourtOfAppealFirstPresidentsColumns({
      onMagistratOpened: remember,
      onPositionEdited: editing.open,
      statusAndAlertCounts,
    }),
    data: items,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: rowIdOf,
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
        data &&
        createPortal(<DataTableCount loaded={seenRows} total={data.totalCount} />, props.titleSlot)}
      {props.filtersSlot &&
        createPortal(
          <div className="flex items-center justify-between gap-4">
            <DataTableFilters table={table} />
            <SearchInput
              className="w-96"
              onChange={search.onChange}
              onClear={search.clear}
              placeholder={formatMessage({ defaultMessage: 'Rechercher un ressort ou un magistrat' })}
              value={search.value}
            />
          </div>,
          props.filtersSlot,
        )}
      <div
        className={clsx('w-full transition-[width] duration-300 ease-out', editing.edited && 'md:w-[52%]')}
      >
        <DataTable
          ariaLabel={formatMessage({
            defaultMessage: "Premiers présidents de cour d'appel et président du tribunal supérieur d'appel",
          })}
          emptyLabel={
            tableState.globalFilter || tableState.columnFilters.length
              ? formatMessage({ defaultMessage: 'Aucune juridiction ne correspond aux filtres fournis' })
              : formatMessage({ defaultMessage: 'Aucune juridiction' })
          }
          fluid
          isLoading={!isError && isLoading}
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
