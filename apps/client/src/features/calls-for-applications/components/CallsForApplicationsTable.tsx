import Badge from '@codegouvfr/react-dsfr/Badge';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';

import { DataTable, DataTableFilters, loadFailureOf, useDataTableUrlState } from '@/shared/ui/data-table';
import { formatDateOnly } from '@/utils/date-only.util';
import { knownValues, stringValues } from '@/utils/known-values.utils';
import {
  type CallForApplications,
  type CallForApplicationsStatus,
  type CallForApplicationsType,
  type CallsForApplicationsPeriod,
  type CallsForApplicationsSorting,
  useCallsForApplicationsQuery,
} from '@queries/calls-for-applications.queries';

import { CallForApplicationsActions } from './CallForApplicationsActions';

const h = createColumnHelper<CallForApplications>();

type FilterValues = { id: string; label: string }[];

function useCallsForApplicationsColumns(props: {
  statuses: FilterValues;
  types: FilterValues;
  years: FilterValues;
}) {
  const { formatDate, formatMessage } = useIntl();
  const { statuses, types, years } = props;

  return useMemo(
    () => [
      h.accessor('type.label', {
        header: formatMessage({ defaultMessage: "Type d'appel" }),
        id: 'type',
        // the filters follow the columns: the year, spanning the whole period of a call, comes first
        meta: {
          filters: [
            {
              filterId: 'years',
              label: formatMessage({ defaultMessage: 'Année' }),
              type: 'enum',
              values: years,
            },
            {
              filterId: 'types',
              label: formatMessage({ defaultMessage: 'Type' }),
              type: 'enum',
              values: types,
            },
          ],
        },
      }),
      h.accessor('targetLabel', {
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Cible' }),
        id: 'target',
        size: 190,
      }),
      h.accessor('createdOn', {
        cell: ({ getValue, row }) => {
          const [last] = row.original.history;
          return (
            <span className="flex flex-col gap-1">
              {formatDateOnly(getValue())}
              {last && last.action !== 'CREATED' && (
                <span className="text-xs leading-4.5 text-(--text-mention-grey)">
                  <FormattedMessage
                    defaultMessage="Dernière mise à jour le {date}"
                    values={{ date: formatDate(last.at, { format: 'zonedDateShort' }) }}
                  />
                </span>
              )}
            </span>
          );
        },
        header: formatMessage({ defaultMessage: 'Date de création' }),
        id: 'createdOn',
      }),
      h.accessor('publishedOn', {
        cell: ({ getValue }) => {
          const publishedOn = getValue();
          return publishedOn ? formatDateOnly(publishedOn) : '-';
        },
        header: formatMessage({ defaultMessage: 'Date de publication' }),
        id: 'publishedOn',
      }),
      h.accessor('deadline', {
        cell: ({ getValue }) => {
          const deadline = getValue();
          return deadline ? formatDateOnly(deadline) : '-';
        },
        header: formatMessage({ defaultMessage: 'Date limite' }),
        id: 'deadline',
        size: 135,
      }),
      h.accessor('status', {
        // the colours of the affectations: published in green, not yet in orange
        cell: ({ getValue }) => {
          const { id, label } = getValue();
          return (
            <Badge
              as="span"
              className="h-6 whitespace-nowrap"
              noIcon
              severity={id === 'PUBLISHED' ? 'success' : 'warning'}
              small
            >
              {label}
            </Badge>
          );
        },
        header: formatMessage({ defaultMessage: 'Statut' }),
        id: 'status',
        meta: {
          filters: {
            filterId: 'statuses',
            label: formatMessage({ defaultMessage: 'Statut' }),
            type: 'enum',
            values: statuses,
          },
        },
      }),
      h.display({
        cell: ({ row }) => <CallForApplicationsActions call={row.original} />,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Actions' }),
        id: 'actions',
        size: 140,
      }),
    ],
    [formatDate, formatMessage, statuses, types, years],
  );
}

const YEAR = /^\d{4}$/;
const SORTABLE_COLUMNS = new Set<string>([
  'createdOn',
  'deadline',
  'publishedOn',
  'status',
  'type',
] satisfies NonNullable<CallsForApplicationsSorting[number]>['id'][]);
/** the order of the spec, which the API keeps without a column picked */
const DEFAULT_SORTING: CallsForApplicationsSorting = [];
const KNOWN_STATUSES: Record<CallForApplicationsStatus, true> = { PUBLISHED: true, UNPUBLISHED: true };
const KNOWN_TYPES: Record<CallForApplicationsType, true> = { CCASS: true, GENERAL: true };
const NO_VALUES: FilterValues = [];

export function CallsForApplicationsTable(props: {
  /** the place of the page header where the filters go, as in the veille des postes */
  filtersSlot: HTMLDivElement | null;
  period: CallsForApplicationsPeriod;
}) {
  const { formatMessage } = useIntl();
  const [defaultFilters] = useState(() => [{ id: 'years', value: [String(new Date().getFullYear())] }]);
  const { onColumnFiltersChange, onSortingChange, tableState } = useDataTableUrlState({
    // the spec opens on the current year. Once every year is unchecked, the link keeps an empty filter: every year
    columnFilters: defaultFilters as (
      | { id: 'statuses'; value: unknown }
      | { id: 'types'; value: unknown }
      | { id: 'years'; value: unknown }
    )[],
    sorting: DEFAULT_SORTING,
  });
  // a saved link can carry a sort the API does not accept
  const [sort] = tableState.sorting;
  const sorting = sort && SORTABLE_COLUMNS.has(sort.id) ? tableState.sorting : DEFAULT_SORTING;
  const filterOf = (id: string) => tableState.columnFilters.find((filter) => filter.id === id)?.value;
  const checkedYears = stringValues(filterOf('years')).filter((year) => YEAR.test(year));
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
  } = useCallsForApplicationsQuery({
    period: props.period,
    sorting,
    statuses: knownValues(filterOf('statuses'), KNOWN_STATUSES),
    types: knownValues(filterOf('types'), KNOWN_TYPES),
    years: checkedYears,
  });
  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError]);
  const checkedYearsJson = JSON.stringify(checkedYears);
  // a checked year stays offered, else it could not be unchecked
  const years = useMemo(
    () =>
      [...new Set([...(data?.years.map(String) ?? []), ...(JSON.parse(checkedYearsJson) as string[])])]
        .toSorted((a, b) => b.localeCompare(a))
        .map((year) => ({ id: year, label: year })),
    [data?.years, checkedYearsJson],
  );
  const table = useReactTable({
    columns: useCallsForApplicationsColumns({
      statuses: data?.statuses ?? NO_VALUES,
      types: data?.types ?? NO_VALUES,
      years,
    }),
    data: useMemo(() => data?.items ?? [], [data]),
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (call) => call.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onSortingChange,
    state: { columnFilters: tableState.columnFilters, sorting },
  });

  return (
    <>
      {props.filtersSlot && createPortal(<DataTableFilters table={table} />, props.filtersSlot)}
      <DataTable
        ariaLabel={
          props.period === 'PAST'
            ? formatMessage({ defaultMessage: 'Appels à candidatures passés' })
            : formatMessage({ defaultMessage: 'Appels à candidatures en cours' })
        }
        emptyLabel={
          JSON.stringify(tableState.columnFilters) !== JSON.stringify(defaultFilters)
            ? formatMessage({ defaultMessage: 'Aucun appel à candidatures ne correspond aux filtres' })
            : formatMessage({ defaultMessage: 'Aucun appel à candidatures' })
        }
        fluid
        isLoading={!isError && isLoading}
        loadError={loadFailureOf({ fetchNextPage, isError, isFetching, isFetchNextPageError, refetch })}
        onEndReached={fetchMore}
        scrollsWithPage
        table={table}
      />
    </>
  );
}
