import Badge from '@codegouvfr/react-dsfr/Badge';
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type CellContext,
} from '@tanstack/react-table';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { NewTable, rowCell } from '@/shared/ui/new-table';
import type { FoundSessionDocsDto } from '@api/types';

export type SessionDocument = FoundSessionDocsDto['items'][number];

const h = createColumnHelper<SessionDocument>();

const SessionDocumentsTableContext = createContext<{
  actions?: (doc: SessionDocument) => ReactNode;
  renderName?: (doc: SessionDocument) => ReactNode;
}>({});

function DocumentState(props: { doc: SessionDocument }) {
  if (props.doc.type === 'agenda' && !props.doc.isLinkedToOfficialReport) {
    return (
      <Badge as="span" className="rounded-full" noIcon severity="error" small>
        <FormattedMessage defaultMessage="pv attendu" />
      </Badge>
    );
  }

  if (props.doc.type === 'officialReport' && props.doc.outdated) {
    return (
      <Badge as="span" className="rounded-full" severity="warning" small>
        <FormattedMessage defaultMessage="À vérifier" />
      </Badge>
    );
  }

  return null;
}

const typeCell = rowCell<SessionDocument>((doc) =>
  doc.type === 'agenda' ? (
    <FormattedMessage defaultMessage="Ordre du jour" />
  ) : (
    <FormattedMessage defaultMessage="Procès-verbal" />
  ),
);

function NameCell(props: CellContext<SessionDocument, string>) {
  const { renderName } = useContext(SessionDocumentsTableContext);
  return renderName?.(props.row.original) ?? props.cell.getValue();
}

const stateCell = rowCell<SessionDocument>((doc) => <DocumentState doc={doc} />);

function ActionsCell(props: CellContext<SessionDocument, unknown>) {
  const { actions } = useContext(SessionDocumentsTableContext);
  return actions?.(props.row.original) ?? null;
}

export function SessionDocumentsTable(props: {
  actions?: (doc: SessionDocument) => ReactNode;
  docs: readonly SessionDocument[];
  renderName?: (doc: SessionDocument) => ReactNode;
}) {
  const { formatMessage } = useIntl();
  const { actions, renderName } = props;

  const renderers = useMemo(() => ({ actions, renderName }), [actions, renderName]);

  const columns = useMemo(
    () => [
      h.accessor('type', {
        cell: typeCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Type' }),
        size: 160,
      }),

      h.accessor('name', {
        cell: NameCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Nom du document' }),
        size: 420,
      }),

      h.display({
        id: 'state',
        cell: stateCell,
        header: formatMessage({ defaultMessage: 'État' }),
        size: 140,
      }),

      h.display({
        id: 'actions',
        cell: ActionsCell,
        header: formatMessage({ defaultMessage: 'Actions' }),
        size: 200,
      }),
    ],
    [formatMessage],
  );

  const table = useReactTable({
    columns,
    data: props.docs as SessionDocument[],
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <SessionDocumentsTableContext.Provider value={renderers}>
      <NewTable
        ariaLabel={formatMessage({ defaultMessage: 'Documents de la session' })}
        emptyLabel={formatMessage({ defaultMessage: 'Aucun document' })}
        fluid
        table={table}
        unvirtualized
        visibleRows={10}
      />
    </SessionDocumentsTableContext.Provider>
  );
}
