import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  ObservationFollowUpEnum,
  ObservationFollowUpEnumMessages,
} from '@/shared/enums/observation-follow-up.enum';
import {
  DataTable,
  DataTableFilters,
  rowCell,
  type TableMetaFilterEnum,
  useDataTableSearch,
  useDataTableUrlState,
} from '@/shared/ui/data-table';
import { SearchInput } from '@/shared/ui/search-input';
import { TotalBadge } from '@/shared/ui/total-badge';
import { formatDateOnly } from '@/utils/date-only.util';
import { type SessionObservation, useInfiniteSessionObservationsQuery } from '@queries/observations.queries';

import { FollowUpCell, ObservantCell, ObservedCell, TargetedCell } from './ObservationCells';

const h = createColumnHelper<SessionObservation>();

export function SessionObservationsTable(props: {
  filtersSlot: Element | null;
  sessionId: string;
  toolbarSlot: Element | null;
}) {
  const intl = useIntl();
  const { onColumnFiltersChange, onSortingChange, setTableState, tableState } = useDataTableUrlState({
    columnFilters: [] as { id: 'followUps'; value: string[] }[],
    globalFilter: '',
    // the most recent blocs come first, as the API does without a sort
    sorting: [{ desc: true, id: 'dateReception' }] as [{ desc: boolean; id: 'dateReception' }],
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteSessionObservationsQuery({
      filters: {
        followUps: tableState.columnFilters.find(({ id }) => id === 'followUps')?.value ?? [],
        search: tableState.globalFilter ?? '',
        sortDesc: tableState.sorting[0]?.desc ?? true,
      },
      sessionId: props.sessionId,
    });

  const search = useDataTableSearch(tableState.globalFilter ?? '', (globalFilter) =>
    setTableState((state) => ({ ...state, globalFilter })),
  );

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const columns = useMemo(() => {
    const followUps: TableMetaFilterEnum = {
      emptyValue: { id: 'null', label: intl.formatMessage({ defaultMessage: 'Aucune' }) },
      filterId: 'followUps',
      label: intl.formatMessage({ defaultMessage: 'Suite(s)' }),
      type: 'enum',
      values: Object.values(ObservationFollowUpEnum).map((followUp) => ({
        id: followUp,
        label: intl.formatMessage(ObservationFollowUpEnumMessages[followUp]),
      })),
    };

    return [
      h.display({
        cell: observantCell(props.sessionId),
        header: intl.formatMessage({ defaultMessage: 'Magistrat observant' }),
        id: 'observant',
        size: 240,
      }),
      h.accessor('dateReception', {
        cell: dateReceptionCell,
        enableSorting: true,
        header: intl.formatMessage({ defaultMessage: 'Date de réception' }),
        id: 'dateReception',
        // the header, its sort icon and its padding on one line
        minSize: 190,
        sortDescFirst: true,
      }),
      h.display({
        cell: fileNumberCell,
        header: intl.formatMessage({ defaultMessage: 'N°' }),
        id: 'fileNumber',
        size: 50,
      }),
      h.display({
        cell: observedCell,
        header: intl.formatMessage({ defaultMessage: 'Magistrat observé' }),
        id: 'observed',
        size: 240,
      }),
      h.display({
        cell: targetedCell,
        header: intl.formatMessage({ defaultMessage: 'Poste cible' }),
        id: 'targeted',
        size: 240,
      }),
      h.display({
        cell: followUpCell,
        header: intl.formatMessage({ defaultMessage: 'Suite' }),
        id: 'followUps',
        meta: { filters: followUps },
        size: 140,
      }),
    ];
  }, [intl, props.sessionId]);

  const observations = useMemo(() => data?.items ?? [], [data]);
  const table = useReactTable({
    columns,
    data: observations,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onSortingChange,
    state: {
      columnFilters: tableState.columnFilters,
      globalFilter: tableState.globalFilter,
      sorting: tableState.sorting,
    },
  });

  const filtersBar = (
    <div className="flex items-center justify-between gap-4">
      <DataTableFilters table={table} />
      <SearchInput
        className="w-72"
        onChange={search.onChange}
        onClear={search.clear}
        placeholder={intl.formatMessage({ defaultMessage: 'Rechercher un observant' })}
        value={search.value}
      />
    </div>
  );

  const toolbar = (
    <div className="flex min-h-10 items-center">
      <TotalBadge value={data?.totalCount ?? 0}>
        <FormattedMessage defaultMessage="Total" />
      </TotalBadge>
    </div>
  );

  return (
    <div className="flex flex-col gap-y-4">
      {props.filtersSlot ? createPortal(filtersBar, props.filtersSlot) : filtersBar}
      {props.toolbarSlot ? createPortal(toolbar, props.toolbarSlot) : toolbar}
      <DataTable
        ariaLabel={intl.formatMessage({ defaultMessage: 'Observations de la session' })}
        emptyLabel={
          tableState.globalFilter || tableState.columnFilters.length > 0
            ? intl.formatMessage({ defaultMessage: 'Aucune observation ne correspond aux valeurs filtrées' })
            : intl.formatMessage({ defaultMessage: 'Aucune observation dans cette session' })
        }
        fluid
        isLoading={isLoading}
        onEndReached={fetchMore}
        scrollsWithPage
        table={table}
      />
    </div>
  );
}

const observantCell = (sessionId: string) =>
  rowCell<SessionObservation>((observation) => (
    <ObservantCell observation={observation} sessionId={sessionId} />
  ));

const dateReceptionCell = rowCell<SessionObservation>(({ dateReception }) => formatDateOnly(dateReception));

const fileNumberCell = rowCell<SessionObservation>(({ nominationFile }) => nominationFile.number ?? '-');

const observedCell = rowCell<SessionObservation>((observation) => <ObservedCell observation={observation} />);

const targetedCell = rowCell<SessionObservation>((observation) => <TargetedCell observation={observation} />);

const followUpCell = rowCell<SessionObservation>((observation) => <FollowUpCell observation={observation} />);
