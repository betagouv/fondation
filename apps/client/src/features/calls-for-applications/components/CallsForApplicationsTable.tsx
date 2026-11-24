import Badge from '@codegouvfr/react-dsfr/Badge';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';

import { DataTable, DataTableFilters, loadFailureOf, useDataTableUrlState } from '@/shared/ui/data-table';
import { formatDateOnly } from '@/utils/date-only.util';
import { knownValues, stringValues } from '@/utils/known-values.utils';
import {
  type CallForApplications,
  type CallForApplicationsStatus,
  type CallsForApplicationsPeriod,
  type CallsForApplicationsSorting,
  type TargetJurisdictionType,
  useCallsForApplicationsQuery,
} from '@queries/calls-for-applications.queries';

import { CallForApplicationsActions } from './CallForApplicationsActions';

const h = createColumnHelper<CallForApplications>();

type FilterValues = { id: string; label: string }[];

function useCallsForApplicationsColumns(props: {
  statuses: FilterValues;
  targetJurisdictionTypes: FilterValues;
  years: FilterValues;
}) {
  const { formatDate, formatMessage } = useIntl();
  const { statuses, targetJurisdictionTypes, years } = props;

  return useMemo(
    () => [
      // a single type so far: sorting it changes nothing
      h.accessor('type.label', {
        enableSorting: false,
        header: formatMessage({ defaultMessage: "Type d'appel" }),
        id: 'type',
      }),
      h.accessor('targetJurisdictionType', {
        cell: ({ getValue }) => getValue()?.label ?? '-',
        header: formatMessage({ defaultMessage: 'Juridiction cible' }),
        id: 'targetJurisdictionType',
        meta: {
          filters: {
            filterId: 'targetJurisdictionTypes',
            label: formatMessage({ defaultMessage: 'Juridiction cible' }),
            type: 'enum',
            values: targetJurisdictionTypes,
          },
        },
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
        meta: {
          filters: {
            filterId: 'years',
            label: formatMessage({ defaultMessage: 'Année' }),
            type: 'enum',
            values: years,
          },
        },
      }),
      h.accessor('deadline', {
        cell: ({ getValue }) => {
          const deadline = getValue();
          return deadline ? formatDateOnly(deadline) : '-';
        },
        header: formatMessage({ defaultMessage: 'Date limite' }),
        id: 'deadline',
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
    [formatDate, formatMessage, statuses, targetJurisdictionTypes, years],
  );
}

const YEAR = /^\d{4}$/;
const SORTABLE_COLUMNS = new Set<string>([
  'createdOn',
  'deadline',
  'publishedOn',
  'status',
  'targetJurisdictionType',
] satisfies NonNullable<CallsForApplicationsSorting[number]>['id'][]);
/** the order of the spec, which the API keeps without a column picked */
const DEFAULT_SORTING: CallsForApplicationsSorting = [];
const KNOWN_STATUSES: Record<CallForApplicationsStatus, true> = { PUBLISHED: true, UNPUBLISHED: true };
const KNOWN_TARGET_JURISDICTION_TYPES: Record<TargetJurisdictionType, true> = {
  COURT_OF_APPEAL: true,
  JUDICIAL_COURT: true,
};
const NO_VALUES: FilterValues = [];

export function CallsForApplicationsTable(props: {
  /** the place of the page header where the filters go, as in the veille des postes */
  filtersSlot: HTMLDivElement | null;
  period: CallsForApplicationsPeriod;
}) {
  const { formatMessage } = useIntl();
  const { onColumnFiltersChange, onSortingChange, tableState } = useDataTableUrlState({
    // the spec opens on the current year. Once every year is unchecked, the link keeps an empty filter: every year
    columnFilters: [{ id: 'years', value: [String(new Date().getFullYear())] }] as (
      | { id: 'statuses'; value: unknown }
      | { id: 'targetJurisdictionTypes'; value: unknown }
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
    targetJurisdictionTypes: knownValues(
      filterOf('targetJurisdictionTypes'),
      KNOWN_TARGET_JURISDICTION_TYPES,
    ),
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
      targetJurisdictionTypes: data?.targetJurisdictionTypes ?? NO_VALUES,
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
          tableState.columnFilters.length > 0
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
