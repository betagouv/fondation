import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';

import {
  KNOWN_ALERTS,
  KNOWN_DEADLINES,
  KNOWN_STATUSES,
  knownValues,
  stringValues,
} from '../utils/known-values.utils';
import { rowsInsideRessortGroups } from '../utils/ressort-groups.utils';
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
  type JudicialCourtPresident,
  type JudicialCourtPresidentsSorting,
  type PositionAlert,
  type PositionStatus,
  type RessortCount,
  JUDICIAL_COURT_PRESIDENTS_DEFAULT_SORTING,
  JUDICIAL_COURT_PRESIDENTS_PAGE_SIZE,
  useJudicialCourtPresidentsQuery,
} from '@queries/veille-des-postes.queries';

import { CenteredRessortLabel } from './CenteredRessortLabel';
import { MagistratLink } from './MagistratLink';
import { PositionStatusCell } from './PositionStatusCell';

const SORTABLE_COLUMNS = new Set<string>([
  'court',
  'installationDate',
  'name',
  'ressort',
  'status',
] satisfies JudicialCourtPresidentsSorting[number]['id'][]);

const NO_RESSORTS: RessortCount[] = [];

const h = createColumnHelper<JudicialCourtPresident>();

/** a magistrat holds one position only, and a court without one is listed once */
function rowIdOf(president: JudicialCourtPresident): string {
  return president.magistrat?.id ?? president.court.id;
}

function useJudicialCourtPresidentsColumns(props: {
  groupedRows: Set<string> | null;
  onMagistratOpened: (event: MouseEvent, magistratId: string) => void;
  ressorts: RessortCount[];
  statusAndAlertCounts: StatusAndAlertCounts;
}) {
  const { formatMessage } = useIntl();
  const { groupedRows, onMagistratOpened, ressorts, statusAndAlertCounts } = props;

  return useMemo(() => {
    const counted = (values: { count: number; id: string; label: string }[]) =>
      values.map(({ count, id, label }) => ({
        id,
        label: formatMessage({ defaultMessage: '{label} ({count})' }, { count, label }),
      }));

    return [
      h.accessor('ressort.label', {
        cell: ({ getValue, row }) =>
          groupedRows ? (
            <CenteredRessortLabel groupId={row.original.ressort.id} label={getValue()} />
          ) : (
            <span className="font-medium">{getValue()}</span>
          ),
        header: formatMessage({ defaultMessage: 'Ressort' }),
        id: 'ressort',
        meta: {
          // one cell for the courts of a ressort, without line inside it
          cellClassName: (row) =>
            clsx(
              'relative border-r border-(--border-default-grey)',
              groupedRows?.has(row.id) &&
                "overflow-visible! after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-(--background-default-grey) after:content-['']",
            ),
          filters: {
            filterId: 'ressort',
            label: formatMessage({ defaultMessage: 'Ressort' }),
            type: 'enum',
            values: counted(ressorts),
          },
        },
        size: 200,
        sortDescFirst: false,
      }),
      h.accessor('court.label', {
        header: formatMessage({ defaultMessage: 'Juridiction' }),
        id: 'court',
        size: 220,
        sortDescFirst: false,
      }),
      h.accessor('magistrat', {
        cell: ({ getValue }) => {
          const magistrat = getValue();
          if (!magistrat) return '-';
          return <MagistratLink magistrat={magistrat} onClick={onMagistratOpened} />;
        },
        header: formatMessage({ defaultMessage: 'Magistrat' }),
        id: 'name',
        size: 220,
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
        size: 200,
        sortDescFirst: false,
      }),
      h.display({
        cell: () => '-',
        header: formatMessage({ defaultMessage: 'Candidats' }),
        id: 'candidates',
        size: 160,
      }),
    ];
  }, [formatMessage, groupedRows, onMagistratOpened, ressorts, statusAndAlertCounts]);
}

export function JudicialCourtPresidentsTable(props: {
  filtersSlot: HTMLDivElement | null;
  titleSlot: HTMLSpanElement | null;
}) {
  const { formatMessage } = useIntl();
  // rounded to a page, so that scrolling within a page renders nothing new
  const [seenRows, setSeenRows] = useState(0);
  const onSeenRowsChange = useCallback(
    (rows: number) =>
      setSeenRows(
        Math.ceil(rows / JUDICIAL_COURT_PRESIDENTS_PAGE_SIZE) * JUDICIAL_COURT_PRESIDENTS_PAGE_SIZE,
      ),
    [],
  );
  const { remember, revealedRowId } = useRowRevealedOnReturn();

  const { onColumnFiltersChange, onSortingChange, setTableState, tableState } = useDataTableUrlState({
    columnFilters: [] as (
      | { id: 'alert'; value: PositionAlert[] }
      | { id: 'deadline'; value: AlertDeadline[] }
      | { id: 'ressort'; value: string[] }
      | { id: 'status'; value: PositionStatus[] }
    )[],
    globalFilter: '',
    sorting: JUDICIAL_COURT_PRESIDENTS_DEFAULT_SORTING,
  });

  // a saved link can carry a sort the API no longer accepts
  const [sort] = tableState.sorting;
  const sorting =
    sort && SORTABLE_COLUMNS.has(sort.id) ? tableState.sorting : JUDICIAL_COURT_PRESIDENTS_DEFAULT_SORTING;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useJudicialCourtPresidentsQuery(
    {
      alerts: knownValues(
        tableState.columnFilters.find((filter) => filter.id === 'alert')?.value,
        KNOWN_ALERTS,
      ),
      deadlines: knownValues(
        tableState.columnFilters.find((filter) => filter.id === 'deadline')?.value,
        KNOWN_DEADLINES,
      ),
      ressorts: stringValues(tableState.columnFilters.find((filter) => filter.id === 'ressort')?.value),
      search: tableState.globalFilter,
      sorting,
      statuses: knownValues(
        tableState.columnFilters.find((filter) => filter.id === 'status')?.value,
        KNOWN_STATUSES,
      ),
    },
  );

  const search = useDataTableSearch(tableState.globalFilter, (globalFilter) =>
    setTableState((state) => ({ ...state, globalFilter })),
  );

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const presidents = useMemo(() => data?.items ?? [], [data]);
  const statusAndAlertCounts = useMemo(
    () =>
      data
        ? { alerts: data.alerts, deadlines: data.deadlines, statuses: data.statuses }
        : NO_STATUS_AND_ALERT_COUNTS,
    [data],
  );
  // the courts of a ressort only follow each other when sorted by ressort
  const groupedRows = useMemo(
    () =>
      sorting[0]?.id === 'ressort'
        ? rowsInsideRessortGroups(
            presidents.map((president) => ({
              id: rowIdOf(president),
              ressortId: president.ressort.id,
            })),
          )
        : null,
    [presidents, sorting],
  );
  const table = useReactTable({
    columns: useJudicialCourtPresidentsColumns({
      groupedRows,
      onMagistratOpened: remember,
      ressorts: data?.ressorts ?? NO_RESSORTS,
      statusAndAlertCounts,
    }),
    data: presidents,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: rowIdOf,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onSortingChange,
    state: { columnFilters: tableState.columnFilters, globalFilter: tableState.globalFilter, sorting },
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
              className="w-128"
              onChange={search.onChange}
              onClear={search.clear}
              placeholder={formatMessage({
                defaultMessage: 'Rechercher un ressort, une juridiction ou un magistrat',
              })}
              value={search.value}
            />
          </div>,
          props.filtersSlot,
        )}
      <DataTable
        ariaLabel={formatMessage({ defaultMessage: 'Présidents de tribunaux judiciaires' })}
        emptyLabel={
          tableState.globalFilter || tableState.columnFilters.length
            ? formatMessage({ defaultMessage: 'Aucun tribunal judiciaire ne correspond aux filtres fournis' })
            : formatMessage({ defaultMessage: 'Aucun tribunal judiciaire' })
        }
        fluid
        isLoading={isLoading}
        onEndReached={fetchMore}
        onSeenRowsChange={onSeenRowsChange}
        revealedRowId={revealedRowId}
        rowTint={(row) =>
          clsx(
            VEILLE_ROW_CLASS,
            row.id === revealedRowId && 'bg-(--background-alt-blue-france)',
            sorting[0]?.id === 'ressort' &&
              row.index > 0 &&
              presidents[row.index - 1]?.ressort.id !== row.original.ressort.id &&
              'border-t border-t-(--border-plain-blue-france)',
          )
        }
        scrollsWithPage
        table={table}
      />
    </>
  );
}
