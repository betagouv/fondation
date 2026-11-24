import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';

import { CommentLastChange } from '@/shared/components/comment-last-change';
import { DataTable, loadFailureOf } from '@/shared/ui/data-table';
import { formatDateOnly } from '@/utils/date-only.util';
import {
  type CallForApplications,
  useCallsForApplicationsQuery,
} from '@queries/calls-for-applications.queries';

const h = createColumnHelper<CallForApplications>();

function useCallsForApplicationsColumns() {
  const { formatMessage } = useIntl();

  return useMemo(
    () => [
      h.accessor('type.label', { header: formatMessage({ defaultMessage: "Type d'appel" }), id: 'type' }),
      h.accessor('targetJurisdictionType', {
        cell: ({ getValue }) => getValue()?.label ?? '-',
        header: formatMessage({ defaultMessage: 'Juridiction cible' }),
        id: 'targetJurisdictionType',
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
      }),
      h.accessor('deadline', {
        cell: ({ getValue }) => {
          const deadline = getValue();
          return deadline ? formatDateOnly(deadline) : '-';
        },
        header: formatMessage({ defaultMessage: 'Date limite' }),
        id: 'deadline',
      }),
      h.accessor('lastChange', {
        cell: ({ getValue }) => <CommentLastChange {...getValue()} />,
        header: formatMessage({ defaultMessage: 'Dernière mise à jour' }),
        id: 'lastChange',
        size: 240,
      }),
      h.accessor('status.label', { header: formatMessage({ defaultMessage: 'Statut' }), id: 'status' }),
    ],
    [formatMessage],
  );
}

export function CallsForApplicationsTable() {
  const { formatMessage } = useIntl();
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
  } = useCallsForApplicationsQuery();
  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError]);
  const table = useReactTable({
    columns: useCallsForApplicationsColumns(),
    data: useMemo(() => data?.items ?? [], [data]),
    // the API sorts the calls
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (call) => call.id,
  });

  return (
    <DataTable
      ariaLabel={formatMessage({ defaultMessage: 'Appels à candidatures' })}
      emptyLabel={formatMessage({ defaultMessage: 'Aucun appel à candidatures' })}
      fluid
      isLoading={!isError && isLoading}
      loadError={loadFailureOf({ fetchNextPage, isError, isFetching, isFetchNextPageError, refetch })}
      onEndReached={fetchMore}
      scrollsWithPage
      table={table}
    />
  );
}
