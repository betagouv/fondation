import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link } from 'react-router';

import { toSessionYearOptions } from '@/features/observations/utils/session-year-options';
import { SessionStatusBadge } from '@/features/sessions/components/SessionStatusBadge';
import { PinnedHeader } from '@/shared/components/pinned-header';
import {
  OBSERVATION_BLOCK_TRACKING_STATUSES,
  type ObservationBlockTrackingStatusEnum,
  ObservationBlockTrackingStatusEnumMessages,
} from '@/shared/enums/observation-block-tracking-status.enum';
import {
  ObservationFollowUpEnum,
  ObservationFollowUpEnumMessages,
} from '@/shared/enums/observation-follow-up.enum';
import {
  DataTable,
  DataTableCount,
  DataTableFilters,
  rowCell,
  type TableMetaFilterAsyncList,
  type TableMetaFilterEnum,
  useDataTableSearch,
  useDataTableUrlState,
} from '@/shared/ui/data-table';
import { SearchInput } from '@/shared/ui/search-input';
import { formatDateOnly } from '@/utils/date-only.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { ListedFollowedUpObservationSessionYearsDto } from '@api/types';
import {
  type FollowedUpObservation,
  type FollowedUpObservationsSorting,
  getFollowedUpObservationSessionYearsQueryOptions,
  type SessionStatus,
  useInfiniteFollowedUpObservationsQuery,
} from '@queries/observations.queries';

import { ObservationBlockTrackingCell } from './ObservationBlockTrackingCell';
import { FollowUpCell, ObservantCell, ObservedCell, TargetedCell } from './ObservationCells';

const h = createColumnHelper<FollowedUpObservation>();

// the sessions never move: the reception date only orders the blocs inside each one, most recent first
// as the API does without a sort
const DEFAULT_SORTING: FollowedUpObservationsSorting = [{ desc: true, id: 'dateReception' }];
const SORTABLE_COLUMNS = new Set<string>(['dateReception']);
const YEAR = /^\d{4}$/;

export function FollowedUpObservationsTable() {
  const intl = useIntl();
  const { onColumnFiltersChange, onSortingChange, setTableState, tableState } = useDataTableUrlState({
    // opens on the observations still to track. Once every filter is unchecked, the link holds an empty
    // `filters=`, which a reload or a shared link keeps: only a link without it opens filtered again
    columnFilters: [{ id: 'trackingStatuses', value: ['IN_PROGRESS'] }] as (
      | { id: 'followUps'; value: string[] }
      | { id: 'sessionStatuses'; value: SessionStatus[] }
      | { id: 'sessionYears'; value: unknown }
      | { id: 'trackingStatuses'; value: ObservationBlockTrackingStatusEnum[] }
    )[],
    globalFilter: '',
    sorting: DEFAULT_SORTING,
  });

  // a saved link can carry a sort the API does not accept
  const [sort] = tableState.sorting;
  const sorting = sort && SORTABLE_COLUMNS.has(sort.id) ? tableState.sorting : DEFAULT_SORTING;
  // a link edited by hand holds any JSON: only its strings are kept as checked years, and only the years go
  // to the API
  const checkedYears = tableState.columnFilters
    .flatMap((filter) => (filter.id === 'sessionYears' && Array.isArray(filter.value) ? filter.value : []))
    .filter((year): year is string => typeof year === 'string');
  // compared by value, so that the columns are rebuilt only when the checked years change
  const checkedYearsJson = JSON.stringify(checkedYears);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteFollowedUpObservationsQuery({
      followUps: tableState.columnFilters.flatMap((filter) =>
        filter.id === 'followUps' ? filter.value : [],
      ),
      search: tableState.globalFilter ?? '',
      sessionStatuses: tableState.columnFilters.flatMap((filter) =>
        filter.id === 'sessionStatuses' ? filter.value : [],
      ),
      sessionYears: checkedYears.filter((year) => YEAR.test(year)),
      sorting,
      trackingStatuses: tableState.columnFilters.flatMap((filter) =>
        filter.id === 'trackingStatuses' ? filter.value : [],
      ),
    });

  const search = useDataTableSearch(tableState.globalFilter ?? '', (globalFilter) =>
    setTableState((state) => ({ ...state, globalFilter })),
  );

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const columns = useMemo(() => {
    const sessionStatuses: TableMetaFilterEnum = {
      filterId: 'sessionStatuses',
      label: intl.formatMessage({ defaultMessage: 'Statut de session' }),
      type: 'enum',
      values: [
        { id: 'TO_VALIDATE', label: intl.formatMessage({ defaultMessage: 'Nouvelles sessions' }) },
        { id: 'ONGOING', label: intl.formatMessage({ defaultMessage: 'Sessions en cours' }) },
        { id: 'REPORTED', label: intl.formatMessage({ defaultMessage: 'Sessions restituées' }) },
        { id: 'ARCHIVED', label: intl.formatMessage({ defaultMessage: 'Sessions archivées' }) },
      ] satisfies { id: SessionStatus; label: string }[],
    };
    const sessionYearsFilter: TableMetaFilterAsyncList = {
      filterId: 'sessionYears',
      label: intl.formatMessage({ defaultMessage: 'Année' }),
      query: {
        ...getFollowedUpObservationSessionYearsQueryOptions(),
        select: (data: ListedFollowedUpObservationSessionYearsDto) =>
          toSessionYearOptions(data, JSON.parse(checkedYearsJson) as string[]),
      },
      type: 'asyncList',
    };
    // only the observations with a suite are listed: "Aucune" is not offered
    const followUps: TableMetaFilterEnum = {
      filterId: 'followUps',
      label: intl.formatMessage({ defaultMessage: 'Suite(s)' }),
      type: 'enum',
      values: Object.values(ObservationFollowUpEnum).map((followUp) => ({
        id: followUp,
        label: intl.formatMessage(ObservationFollowUpEnumMessages[followUp]),
      })),
    };

    const trackingStatuses: TableMetaFilterEnum = {
      filterId: 'trackingStatuses',
      label: intl.formatMessage({ defaultMessage: 'Statut de suivi' }),
      type: 'enum',
      values: OBSERVATION_BLOCK_TRACKING_STATUSES.map((status) => ({
        id: status,
        label: intl.formatMessage(ObservationBlockTrackingStatusEnumMessages[status]),
      })),
    };

    return [
      h.display({
        cell: sessionCell,
        header: intl.formatMessage({ defaultMessage: 'Session' }),
        id: 'session',
        meta: { filters: [sessionStatuses, sessionYearsFilter] },
        size: 220,
      }),
      h.display({
        cell: rowCell<FollowedUpObservation>(({ observation, session }) => (
          <ObservantCell observation={observation} sessionId={session.id} />
        )),
        header: intl.formatMessage({ defaultMessage: 'Magistrat observant' }),
        id: 'observant',
        size: 240,
      }),
      h.accessor('observation.dateReception', {
        cell: rowCell<FollowedUpObservation>(({ observation }) => formatDateOnly(observation.dateReception)),
        enableSorting: true,
        header: intl.formatMessage({ defaultMessage: 'Date de réception' }),
        id: 'dateReception',
        meta: { wrapHeader: true },
        // the header on two lines, its sort icon and its padding
        minSize: 120,
        sortDescFirst: true,
      }),
      h.display({
        cell: rowCell<FollowedUpObservation>(({ observation }) => <ObservedCell observation={observation} />),
        header: intl.formatMessage({ defaultMessage: 'Magistrat observé' }),
        id: 'observed',
        size: 240,
      }),
      h.display({
        cell: rowCell<FollowedUpObservation>(({ observation }) => <TargetedCell observation={observation} />),
        header: intl.formatMessage({ defaultMessage: 'Poste cible' }),
        id: 'targeted',
        size: 240,
      }),
      h.display({
        cell: rowCell<FollowedUpObservation>(({ observation }) => <FollowUpCell observation={observation} />),
        header: intl.formatMessage({ defaultMessage: 'Suite' }),
        id: 'followUps',
        meta: { filters: followUps },
        // the longest tag and its padding on one line
        minSize: 150,
        size: 150,
      }),
      h.display({
        cell: rowCell<FollowedUpObservation>((row) => <ObservationBlockTrackingCell row={row} />),
        header: intl.formatMessage({ defaultMessage: 'Statut de suivi' }),
        id: 'trackingStatuses',
        meta: { filters: trackingStatuses },
        // the badge, the later propositions icon and the edit button on one line
        minSize: 180,
        size: 200,
      }),
    ];
  }, [intl, checkedYearsJson]);

  const observations = useMemo(() => data?.items ?? [], [data]);
  const table = useReactTable({
    columns,
    data: observations,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.observation.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onSortingChange,
    state: {
      columnFilters: tableState.columnFilters,
      globalFilter: tableState.globalFilter,
      sorting,
    },
  });

  return (
    <PinnedHeader
      bar={(isPinned) => (
        <div className={clsx('flex flex-col gap-y-6', { 'fr-container': isPinned })}>
          <h1 className="fr-h3 fr-mb-0">
            <FormattedMessage defaultMessage="Suivi des observations" />
            {data && <DataTableCount loaded={observations.length} total={data.totalCount} />}
          </h1>
          <div className="flex items-center justify-between gap-4">
            <DataTableFilters table={table} />
            <SearchInput
              className="ml-auto w-72"
              onChange={search.onChange}
              onClear={search.clear}
              placeholder={intl.formatMessage({ defaultMessage: 'Rechercher un observant' })}
              value={search.value}
            />
          </div>
        </div>
      )}
      barClassName="fr-pb-2v"
      contentClassName="flex flex-col gap-y-6"
      pinnedBarClassName="fr-pt-6v"
    >
      <DataTable
        ariaLabel={intl.formatMessage({ defaultMessage: 'Observations qui ont une suite' })}
        emptyLabel={
          tableState.globalFilter || tableState.columnFilters.length > 0
            ? intl.formatMessage({ defaultMessage: 'Aucune observation ne correspond aux valeurs filtrées' })
            : intl.formatMessage({ defaultMessage: 'Aucune observation n’a de suite' })
        }
        fluid
        isLoading={isLoading}
        onEndReached={fetchMore}
        scrollsWithPage
        table={table}
      />
    </PinnedHeader>
  );
}

const sessionCell = rowCell<FollowedUpObservation>(({ session }) => (
  <div className="flex flex-col items-start gap-1 leading-6">
    <span>
      <Link
        className="fr-link fr-link--sm box-decoration-clone"
        to={generatePath(ROUTE_PATHS.SG.GDS.SESSION_ID_OBSERVATIONS, { sessionId: session.id })}
      >
        {session.name}
      </Link>
    </span>
    <SessionStatusBadge status={session.status} />
    <span className="text-xs leading-6">{formatDateOnly(session.date)}</span>
  </div>
));
