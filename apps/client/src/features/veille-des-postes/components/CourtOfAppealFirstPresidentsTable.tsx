import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';

import { KNOWN_STATUSES, knownValues } from '../utils/known-values.utils';
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
  type CourtOfAppealFirstPresident,
  type CourtOfAppealFirstPresidentsSorting,
  type PositionStatus,
  type PositionStatusCount,
  COURT_OF_APPEAL_FIRST_PRESIDENTS_DEFAULT_SORTING,
  COURT_OF_APPEAL_FIRST_PRESIDENTS_PAGE_SIZE,
  useCourtOfAppealFirstPresidentsQuery,
} from '@queries/veille-des-postes.queries';

import { MagistratLink } from './MagistratLink';
import { PositionStatusBadge } from './PositionStatusBadge';

const SORTABLE_COLUMNS = new Set<string>([
  'court',
  'installationDate',
  'name',
] satisfies CourtOfAppealFirstPresidentsSorting[number]['id'][]);

const NO_STATUSES: PositionStatusCount[] = [];

const h = createColumnHelper<CourtOfAppealFirstPresident>();

function useCourtOfAppealFirstPresidentsColumns(props: {
  onMagistratOpened: (event: MouseEvent, magistratId: string) => void;
  statuses: PositionStatusCount[];
}) {
  const { formatMessage } = useIntl();
  const { onMagistratOpened, statuses } = props;

  return useMemo(
    () => [
      h.accessor('court.label', {
        cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        header: formatMessage({ defaultMessage: 'Ressort' }),
        id: 'court',
        size: 280,
        sortDescFirst: false,
      }),
      h.accessor('status', {
        cell: ({ getValue }) => <PositionStatusBadge status={getValue()} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Alerte / statut' }),
        id: 'status',
        meta: {
          filters: {
            filterId: 'status',
            label: formatMessage({ defaultMessage: 'Alerte / statut' }),
            type: 'enum',
            values: statuses.map(({ count, id, label }) => ({
              id,
              label: formatMessage({ defaultMessage: '{label} ({count})' }, { count, label }),
            })),
          },
        },
        size: 240,
      }),
      h.accessor('magistrat', {
        cell: ({ getValue }) => {
          const magistrat = getValue();
          if (!magistrat) return '-';
          return <MagistratLink magistrat={magistrat} onClick={onMagistratOpened} />;
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
      h.display({
        cell: () => '-',
        header: formatMessage({ defaultMessage: 'Desiderata' }),
        id: 'desiderata',
        size: 160,
      }),
      h.display({
        cell: () => '-',
        header: formatMessage({ defaultMessage: 'Candidats' }),
        id: 'candidates',
        size: 160,
      }),
    ],
    [formatMessage, onMagistratOpened, statuses],
  );
}

export function CourtOfAppealFirstPresidentsTable(props: {
  filtersSlot: HTMLDivElement | null;
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
    columnFilters: [] as { id: 'status'; value: PositionStatus[] }[],
    globalFilter: '',
    sorting: COURT_OF_APPEAL_FIRST_PRESIDENTS_DEFAULT_SORTING,
  });

  // a saved link can carry a sort the API no longer accepts
  const [sort] = tableState.sorting;
  const sorting =
    sort && SORTABLE_COLUMNS.has(sort.id)
      ? tableState.sorting
      : COURT_OF_APPEAL_FIRST_PRESIDENTS_DEFAULT_SORTING;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useCourtOfAppealFirstPresidentsQuery({
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
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const table = useReactTable({
    columns: useCourtOfAppealFirstPresidentsColumns({
      onMagistratOpened: remember,
      statuses: data?.statuses ?? NO_STATUSES,
    }),
    data: useMemo(() => data?.items ?? [], [data]),
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    // a magistrat holds one position only, and a court without one is listed once
    getRowId: (row) => row.magistrat?.id ?? row.court.id,
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
              className="w-96"
              onChange={search.onChange}
              onClear={search.clear}
              placeholder={formatMessage({ defaultMessage: 'Rechercher un ressort ou un magistrat' })}
              value={search.value}
            />
          </div>,
          props.filtersSlot,
        )}
      <DataTable
        ariaLabel={formatMessage({ defaultMessage: "Premiers présidents de cour d'appel" })}
        emptyLabel={
          tableState.globalFilter || tableState.columnFilters.length
            ? formatMessage({ defaultMessage: "Aucune cour d'appel ne correspond aux filtres fournis" })
            : formatMessage({ defaultMessage: "Aucune cour d'appel" })
        }
        fluid
        isLoading={isLoading}
        onEndReached={fetchMore}
        onSeenRowsChange={onSeenRowsChange}
        revealedRowId={revealedRowId}
        rowTint={(row) => (row.id === revealedRowId ? 'bg-(--background-alt-blue-france)' : undefined)}
        scrollsWithPage
        table={table}
      />
    </>
  );
}
