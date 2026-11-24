import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';

import { DataTable, DataTableFilters, loadFailureOf, useDataTableUrlState } from '@/shared/ui/data-table';
import { formatDateOnly } from '@/utils/date-only.util';
import { knownValues, stringValues } from '@/utils/known-values.utils';
import {
  type CallForApplications,
  type CallForApplicationsStatus,
  type CallsForApplicationsPeriod,
  type TargetJurisdictionType,
  useCallsForApplicationsQuery,
} from '@queries/calls-for-applications.queries';

import { CallForApplicationsLastChange } from './CallForApplicationsLastChange';

const h = createColumnHelper<CallForApplications>();

type FilterValues = { id: string; label: string }[];

function useCallsForApplicationsColumns(props: {
  statuses: FilterValues;
  targetJurisdictionTypes: FilterValues;
  years: FilterValues;
}) {
  const { formatMessage } = useIntl();
  const { statuses, targetJurisdictionTypes, years } = props;

  return useMemo(
    () => [
      h.accessor('type.label', { header: formatMessage({ defaultMessage: "Type d'appel" }), id: 'type' }),
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
        cell: ({ getValue }) => formatDateOnly(getValue()),
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
      h.accessor('history', {
        cell: ({ getValue }) => <CallForApplicationsLastChange history={getValue()} />,
        header: formatMessage({ defaultMessage: 'Dernière mise à jour' }),
        id: 'lastChange',
      }),
      h.accessor('status.label', {
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
    ],
    [formatMessage, statuses, targetJurisdictionTypes, years],
  );
}

const YEAR = /^\d{4}$/;
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
  const { onColumnFiltersChange, tableState } = useDataTableUrlState({
    // the spec opens on the current year. Once every year is unchecked, the link keeps an empty filter: every year
    columnFilters: [{ id: 'years', value: [String(new Date().getFullYear())] }] as (
      | { id: 'statuses'; value: unknown }
      | { id: 'targetJurisdictionTypes'; value: unknown }
      | { id: 'years'; value: unknown }
    )[],
  });
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
    // the API sorts the calls
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (call) => call.id,
    manualFiltering: true,
    onColumnFiltersChange,
    state: { columnFilters: tableState.columnFilters },
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
