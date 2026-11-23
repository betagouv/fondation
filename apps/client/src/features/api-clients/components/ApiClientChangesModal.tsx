import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { DataTable } from '@/shared/ui/data-table';
import { Modal } from '@/shared/ui/modal';
import type { ListedApiClientChangesDto } from '@api/types';
import { useApiClientChangesQuery } from '@queries/api-clients.queries';

type ListedApiClientChange = ListedApiClientChangesDto['items'][number];

const h = createColumnHelper<ListedApiClientChange>();

/** The client stays mounted for the fade out: the caller keeps it until onClosed */
export function ApiClientChangesModal(props: {
  client: { id: string; name: string } | null;
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
}) {
  const { formatMessage } = useIntl();

  return (
    <Modal
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      size="large"
      title={formatMessage({ defaultMessage: 'Historique de « {name} »' }, { name: props.client?.name })}
    >
      {props.client && <ApiClientChangesTable clientId={props.client.id} />}
    </Modal>
  );
}

function ApiClientChangesTable(props: { clientId: string }) {
  const { formatMessage } = useIntl();
  const dateAndTime = useDateAndTime();
  const { data, isError, isFetching, isLoading, refetch } = useApiClientChangesQuery(props.clientId);

  const columns = useMemo(
    () => [
      h.display({
        cell: ({ row }) => (
          <FormattedMessage defaultMessage="{date} à {time}" values={dateAndTime(row.original.changedAt)} />
        ),
        header: formatMessage({ defaultMessage: 'Date' }),
        id: 'changedAt',
        size: 180,
      }),
      h.display({
        cell: ({ row }) => {
          const { change, previousSecretValidUntil } = row.original;
          if (!previousSecretValidUntil) return change.label;

          return (
            <FormattedMessage
              defaultMessage="{label} (ancien secret valable jusqu'au {date} à {time})"
              values={{ label: change.label, ...dateAndTime(previousSecretValidUntil) }}
            />
          );
        },
        header: formatMessage({ defaultMessage: 'Action' }),
        id: 'change',
        size: 320,
      }),
      h.display({
        cell: ({ row }) => row.original.changedBy.name,
        header: formatMessage({ defaultMessage: 'Auteur' }),
        id: 'changedBy',
        size: 260,
      }),
    ],
    [dateAndTime, formatMessage],
  );

  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <DataTable
      ariaLabel={formatMessage({ defaultMessage: 'Historique du client API' })}
      emptyLabel={formatMessage({ defaultMessage: 'Aucune action enregistrée' })}
      fluid
      isLoading={isLoading}
      loadError={
        isError ? { isNextPage: false, isRetrying: isFetching, onRetry: () => void refetch() } : undefined
      }
      table={table}
      unvirtualized
    />
  );
}
