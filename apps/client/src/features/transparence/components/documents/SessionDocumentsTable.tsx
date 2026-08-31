import Badge from '@codegouvfr/react-dsfr/Badge';
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type CellContext,
} from '@tanstack/react-table';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { NewTable, rowCell } from '@/shared/ui/new-table';

import { groupSessionDocuments, type SessionDocument } from './session-document-groups';

export type { SessionDocument } from './session-document-groups';

const HIGHLIGHT_DURATION = 3000;

type Association = { agendasCount: number; associatedIds: string[] };

const h = createColumnHelper<SessionDocument>();

const SessionDocumentsTableContext = createContext<{
  actions?: (doc: SessionDocument) => ReactNode;
  associations?: ReadonlyMap<string, Association>;
  highlightAssociated?: (doc: SessionDocument) => void;
  renderName?: (doc: SessionDocument) => ReactNode;
}>({});

function DocumentState(props: { doc: SessionDocument }) {
  if (props.doc.type === 'agenda' && !props.doc.officialReportId) {
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

function AssociationLink(props: { association: Association; doc: SessionDocument }) {
  const { highlightAssociated } = useContext(SessionDocumentsTableContext);
  const { association, doc } = props;

  return (
    <button
      className="cursor-pointer border-none bg-transparent p-0 text-left text-(--text-action-high-blue-france) underline"
      onClick={() => highlightAssociated?.(doc)}
      type="button"
    >
      {doc.type === 'agenda' ? (
        <FormattedMessage defaultMessage="Voir le PV associé" />
      ) : (
        <FormattedMessage
          defaultMessage="{count, plural, one {Voir l'ODJ associé} other {Voir les # ODJ associés}}"
          values={{ count: association.agendasCount }}
        />
      )}
    </button>
  );
}

function StateCell(props: CellContext<SessionDocument, unknown>) {
  const { associations } = useContext(SessionDocumentsTableContext);
  const doc = props.row.original;
  const association = associations?.get(doc.id);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {association && <AssociationLink association={association} doc={doc} />}
      <DocumentState doc={doc} />
    </div>
  );
}

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

  const groups = useMemo(() => groupSessionDocuments(props.docs), [props.docs]);
  const data = useMemo(() => groups.flat(), [groups]);

  const associations = useMemo(
    () =>
      new Map(
        groups
          .filter((group) => group.length > 1)
          .flatMap((group): [string, Association][] => {
            const agendasCount = group.filter((doc) => doc.type === 'agenda').length;
            return group.map((doc) => [
              doc.id,
              {
                agendasCount,
                associatedIds: group.filter((other) => other.type !== doc.type).map((other) => other.id),
              },
            ]);
          }),
      ),
    [groups],
  );

  const [highlightedIds, setHighlightedIds] = useState<readonly string[]>([]);
  const highlightTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(highlightTimeout.current), []);

  const highlightAssociated = useCallback(
    (doc: SessionDocument) => {
      const association = associations.get(doc.id);
      if (!association) return;

      clearTimeout(highlightTimeout.current);
      setHighlightedIds(association.associatedIds);
      highlightTimeout.current = setTimeout(() => setHighlightedIds([]), HIGHLIGHT_DURATION);
    },
    [associations],
  );

  const renderers = useMemo(
    () => ({ actions, associations, highlightAssociated, renderName }),
    [actions, associations, highlightAssociated, renderName],
  );

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
        cell: StateCell,
        header: formatMessage({ defaultMessage: 'État' }),
        size: 240,
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
    data,
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
        rowTint={(row) => (highlightedIds.includes(row.id) ? 'bg-(--background-alt-blue-france)' : undefined)}
        table={table}
        unvirtualized
        visibleRows={10}
      />
    </SessionDocumentsTableContext.Provider>
  );
}
