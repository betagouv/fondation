import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type CellContext,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table';
import { createContext, Fragment, useContext, useMemo, type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { NewTable, rowCell } from '@/shared/ui/new-table';
import { compareDateOnly, formatDateOnly } from '@/utils/date-only.util';
import { formatFileSize } from '@/utils/file.utils';
import type { ListedNominationSessionAttachmentDto } from '@api/types';

export type SessionAttachment = ListedNominationSessionAttachmentDto['items'][number];

const h = createColumnHelper<SessionAttachment>();

type AttachmentAction = (attachment: SessionAttachment) => ReactNode;

const NO_ACTION: readonly AttachmentAction[] = [];

const SessionAttachmentsTableContext = createContext<{
  actions: readonly AttachmentAction[];
  renderName?: (attachment: SessionAttachment) => ReactNode;
}>({ actions: [] });

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
  if (actions.length === 0) return null;

  return (
    <div className="-ml-2 flex items-center gap-1">
      {actions.map((action, index) => (
        <Fragment key={index}>{action(props.row.original)}</Fragment>
      ))}
    </div>
  );
}

export function SessionAttachmentsTable(props: {
  actions?: readonly AttachmentAction[];
  attachments: readonly SessionAttachment[];
  onSortingChange?: OnChangeFn<SortingState>;
  renderName?: (attachment: SessionAttachment) => ReactNode;
  sorting?: SortingState;
}) {
  const { formatMessage } = useIntl();
  const { actions = NO_ACTION, renderName } = props;

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
        header: formatMessage(
          { defaultMessage: '{count, plural, one {Action} other {Actions}}' },
          { count: actions.length },
        ),
        size: 160,
      }),
    ],
    [actions.length, formatMessage],
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
