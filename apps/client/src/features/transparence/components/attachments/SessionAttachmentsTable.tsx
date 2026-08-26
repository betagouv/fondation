import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type CellContext,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { NewTable, rowCell } from '@/shared/ui/new-table';
import { compareDateOnly, formatDateOnly } from '@/utils/date-only.util';
import { formatFileSize } from '@/utils/file.utils';
import type { ListedNominationSessionAttachmentDto } from '@api/types';

export type SessionAttachment = ListedNominationSessionAttachmentDto['items'][number];

const h = createColumnHelper<SessionAttachment>();

const SessionAttachmentsTableContext = createContext<{
  actions?: (attachment: SessionAttachment) => ReactNode;
  renderName?: (attachment: SessionAttachment) => ReactNode;
}>({});

function NameCell(props: CellContext<SessionAttachment, string>) {
  const { renderName } = useContext(SessionAttachmentsTableContext);
  return renderName?.(props.row.original) ?? props.cell.getValue();
}

const addedAtCell = rowCell<SessionAttachment>((attachment) => formatDateOnly(attachment.addedAt));

const sizeCell = rowCell<SessionAttachment>((attachment) =>
  attachment.sizeInBytes ? formatFileSize(attachment.sizeInBytes) : null,
);

function ActionsCell(props: CellContext<SessionAttachment, unknown>) {
  const { actions } = useContext(SessionAttachmentsTableContext);
  return actions?.(props.row.original) ?? null;
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

  const renderers = useMemo(() => ({ actions, renderName }), [actions, renderName]);

  const columns = useMemo(
    () => [
      h.accessor('name', {
        cell: NameCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Nom du fichier' }),
        size: 420,
      }),

      h.accessor('addedAt', {
        cell: addedAtCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Ajoutée le' }),
        size: 160,
        sortingFn: (a, b) => compareDateOnly(a.original.addedAt, b.original.addedAt),
      }),

      h.accessor('sizeInBytes', {
        cell: sizeCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Taille' }),
        size: 120,
      }),

      h.display({
        id: 'actions',
        cell: ActionsCell,
        header: formatMessage({ defaultMessage: 'Actions' }),
        size: 160,
      }),
    ],
    [formatMessage],
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
    <SessionAttachmentsTableContext.Provider value={renderers}>
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
    </SessionAttachmentsTableContext.Provider>
  );
}
