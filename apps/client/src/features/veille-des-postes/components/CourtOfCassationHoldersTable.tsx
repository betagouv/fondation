import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
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
  type CourtOfCassationHolder,
  type CourtOfCassationHoldersSorting,
  type CourtOfCassationPosition,
  type CourtOfCassationPositionCount,
  type PositionStatus,
  type PositionStatusCount,
  COURT_OF_CASSATION_HOLDERS_DEFAULT_SORTING,
  COURT_OF_CASSATION_HOLDERS_PAGE_SIZE,
  useCourtOfCassationHoldersQuery,
} from '@queries/veille-des-postes.queries';

import { MagistratLink } from './MagistratLink';
import { PositionStatusBadge } from './PositionStatusBadge';

const SORTABLE_COLUMNS = new Set<string>([
  'installationDate',
  'name',
] satisfies CourtOfCassationHoldersSorting[number]['id'][]);

const KNOWN_POSITIONS: Record<CourtOfCassationPosition, true> = {
  AUDITOR_FIRST_GRADE: true,
  AUDITOR_SECOND_GRADE: true,
  CHAMBER_PRESIDENT: true,
  COUNSELLOR: true,
  FIRST_PRESIDENT: true,
  REFERENDARY_COUNSELLOR: true,
};

const NO_POSITIONS: CourtOfCassationPositionCount[] = [];
const NO_STATUSES: PositionStatusCount[] = [];

const h = createColumnHelper<CourtOfCassationHolder>();

function useCourtOfCassationHoldersColumns(props: {
  onMagistratOpened: (event: MouseEvent, magistratId: string) => void;
  positions: CourtOfCassationPositionCount[];
  statuses: PositionStatusCount[];
}) {
  const { formatMessage } = useIntl();
  const { onMagistratOpened } = props;

  return useMemo(() => {
    const counted = (values: { count: number; id: string; label: string }[]) =>
      values.map(({ count, id, label }) => ({
        id,
        label: formatMessage({ defaultMessage: '{label} ({count})' }, { count, label }),
      }));

    return [
      h.accessor('position.label', {
        cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Poste' }),
        id: 'position',
        meta: {
          filters: {
            filterId: 'position',
            label: formatMessage({ defaultMessage: 'Poste' }),
            type: 'enum',
            values: counted(props.positions),
          },
        },
        size: 220,
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
            values: counted(props.statuses),
          },
        },
        size: 240,
      }),
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
    ];
  }, [formatMessage, onMagistratOpened, props.positions, props.statuses]);
}

export function CourtOfCassationHoldersTable(props: {
  filtersSlot: HTMLDivElement | null;
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
      | { id: 'position'; value: CourtOfCassationPosition[] }
      | { id: 'status'; value: PositionStatus[] }
    )[],
    globalFilter: '',
    sorting: COURT_OF_CASSATION_HOLDERS_DEFAULT_SORTING,
  });

  // a saved link can carry a sort the API no longer accepts
  const [sort] = tableState.sorting;
  const sorting =
    sort && SORTABLE_COLUMNS.has(sort.id) ? tableState.sorting : COURT_OF_CASSATION_HOLDERS_DEFAULT_SORTING;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useCourtOfCassationHoldersQuery(
    {
      positions: knownValues(
        tableState.columnFilters.find((filter) => filter.id === 'position')?.value,
        KNOWN_POSITIONS,
      ),
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

  const holders = useMemo(() => data?.items ?? [], [data]);
  const table = useReactTable({
    columns: useCourtOfCassationHoldersColumns({
      onMagistratOpened: remember,
      positions: data?.positions ?? NO_POSITIONS,
      statuses: data?.statuses ?? NO_STATUSES,
    }),
    data: holders,
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
        data &&
        createPortal(<DataTableCount loaded={seenRows} total={data.totalCount} />, props.titleSlot)}
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
      <DataTable
        ariaLabel={formatMessage({ defaultMessage: 'Magistrats du siège de la Cour de cassation' })}
        emptyLabel={
          tableState.globalFilter || tableState.columnFilters.length
            ? formatMessage({ defaultMessage: 'Aucun magistrat ne correspond aux filtres fournis' })
            : formatMessage({ defaultMessage: 'Aucun magistrat à la Cour de cassation' })
        }
        fluid
        isLoading={isLoading}
        onEndReached={fetchMore}
        onSeenRowsChange={onSeenRowsChange}
        revealedRowId={revealedRowId}
        rowTint={(row) =>
          clsx(
            row.id === revealedRowId && 'bg-(--background-alt-blue-france)',
            row.index > 0 &&
              holders[row.index - 1]?.position.id !== row.original.position.id &&
              'border-t-2 border-t-(--border-plain-blue-france)',
          )
        }
        scrollsWithPage
        table={table}
      />
    </>
  );
}
