import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table';
import { useMemo, type ReactNode } from 'react';
import { FormattedDate, useIntl } from 'react-intl';

import { NewTable } from '@/shared/ui/new-table';
import { dateOnlyToDate, type PlainDateOnly } from '@/utils/date-only.util';
import { formatFileSize } from '@/utils/file.utils';

export type SessionAttachment = {
  addedAt?: PlainDateOnly | null;
  id: string;
  name: string;
  sizeInBytes?: number | null;
};

const h = createColumnHelper<SessionAttachment>();

function addedAtTime(attachment: SessionAttachment) {
  return attachment.addedAt ? dateOnlyToDate(attachment.addedAt).getTime() : 0;
}

export function SessionAttachmentsTable(props: {
  actions?: (attachment: SessionAttachment) => ReactNode;
  attachments: readonly SessionAttachment[];
  onSortingChange?: OnChangeFn<SortingState>;
  renderName?: (attachment: SessionAttachment) => ReactNode;
  sorting?: SortingState;
}) {
  const { formatMessage } = useIntl();
  const { actions, renderName } = props;

  const columns = useMemo(
    () => [
      h.accessor('name', {
        cell: ({ row }) => renderName?.(row.original) ?? row.original.name,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Nom du fichier' }),
        size: 420,
      }),

      h.accessor('addedAt', {
        cell: ({ cell }) => {
          const value = cell.getValue();
          return value ? <FormattedDate value={dateOnlyToDate(value)} /> : null;
        },
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Ajoutée le' }),
        size: 160,
        sortingFn: (a, b) => addedAtTime(a.original) - addedAtTime(b.original),
      }),

      h.accessor('sizeInBytes', {
        cell: ({ cell }) => {
          const value = cell.getValue();
          return value ? formatFileSize(value) : null;
        },
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Taille' }),
        size: 120,
      }),

      h.display({
        id: 'actions',
        cell: ({ row }) => actions?.(row.original),
        header: formatMessage({ defaultMessage: 'Actions' }),
        size: 160,
      }),
    ],
    [actions, formatMessage, renderName],
  );

  const table = useReactTable({
    columns,
    data: props.attachments as SessionAttachment[],
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: props.onSortingChange,
    state: props.sorting ? { sorting: props.sorting } : {},
  });

  return (
    <NewTable
      ariaLabel={formatMessage({
        defaultMessage: 'Pièces jointes de la session',
      })}
      emptyLabel={formatMessage({ defaultMessage: 'Aucune pièce jointe' })}
      fluid
      table={table}
      unvirtualized
      visibleRows={10}
    />
  );
}
