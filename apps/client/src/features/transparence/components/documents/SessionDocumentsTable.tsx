import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
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

import {
  sessionDocumentStates,
  type SessionDocument,
  type SessionDocumentGroupState,
} from './session-document-groups';

export type { SessionDocument } from './session-document-groups';

const HIGHLIGHT_DURATION = 3000;

type Association = { agendasCount: number; associated: SessionDocument[] };

const h = createColumnHelper<SessionDocument>();

const SessionDocumentsTableContext = createContext<{
  actions?: (doc: SessionDocument) => ReactNode;
  associations?: ReadonlyMap<string, Association>;
  highlightAssociated?: (doc: SessionDocument) => void;
  renderName?: (doc: SessionDocument) => ReactNode;
  states?: ReadonlyMap<string, SessionDocumentGroupState>;
}>({});

function DocumentState(props: { state: SessionDocumentGroupState | undefined }) {
  if (props.state === 'awaitingOfficialReport') {
    return (
      <Badge as="span" className="rounded-full" noIcon severity="error" small>
        <FormattedMessage defaultMessage="pv attendu" />
      </Badge>
    );
  }

  if (props.state === 'outdatedOfficialReport') {
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
    <Button
      className="fr-btn--align-on-content whitespace-nowrap"
      onClick={() => highlightAssociated?.(doc)}
      priority="tertiary no outline"
      size="small"
    >
      {doc.type === 'agenda' ? (
        <FormattedMessage defaultMessage="Voir le PV associé" />
      ) : (
        <FormattedMessage
          defaultMessage="{count, plural, one {Voir l'ODJ associé} other {Voir les # ODJ associés}}"
          values={{ count: association.agendasCount }}
        />
      )}
    </Button>
  );
}

function StateCell(props: CellContext<SessionDocument, unknown>) {
  const { associations, states } = useContext(SessionDocumentsTableContext);
  const doc = props.row.original;
  const association = associations?.get(doc.id);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {association && <AssociationLink association={association} doc={doc} />}
      <DocumentState state={states?.get(doc.id)} />
    </div>
  );
}

function ActionsCell(props: CellContext<SessionDocument, unknown>) {
  const { actions } = useContext(SessionDocumentsTableContext);
  return actions?.(props.row.original) ?? null;
}

export function SessionDocumentsTable(props: {
  actions?: (doc: SessionDocument) => ReactNode;
  groups: readonly (readonly SessionDocument[])[];
  renderName?: (doc: SessionDocument) => ReactNode;
}) {
  const { formatMessage } = useIntl();
  const { actions, groups, renderName } = props;

  const data = useMemo(() => groups.flat(), [groups]);
  const states = useMemo(() => sessionDocumentStates(groups), [groups]);

  const associations = useMemo(
    () =>
      new Map(
        groups
          .filter((group) => group.length > 1)
          .flatMap((group): [string, Association][] => {
            const agendasCount = group.filter((doc) => doc.type === 'agenda').length;
            return group.map((doc) => [
              doc.id,
              { agendasCount, associated: group.filter((other) => other.type !== doc.type) },
            ]);
          }),
      ),
    [groups],
  );

  const [highlighted, setHighlighted] = useState<{ announcement: string; ids: readonly string[] }>({
    announcement: '',
    ids: [],
  });
  const highlightTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(highlightTimeout.current), []);

  const highlightAssociated = useCallback(
    (doc: SessionDocument) => {
      const association = associations.get(doc.id);
      if (!association) return;

      clearTimeout(highlightTimeout.current);
      setHighlighted({
        announcement: formatMessage(
          {
            defaultMessage: '{count, plural, one {Document associé} other {Documents associés}} : {names}',
          },
          {
            count: association.associated.length,
            names: association.associated.map(({ name }) => name).join(', '),
          },
        ),
        ids: association.associated.map(({ id }) => id),
      });
      highlightTimeout.current = setTimeout(
        () => setHighlighted({ announcement: '', ids: [] }),
        HIGHLIGHT_DURATION,
      );
    },
    [associations, formatMessage],
  );

  const renderers = useMemo(
    () => ({ actions, associations, highlightAssociated, renderName, states }),
    [actions, associations, highlightAssociated, renderName, states],
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
        revealedRowId={highlighted.ids[0] ?? null}
        rowTint={(row) =>
          highlighted.ids.includes(row.id) ? 'bg-(--background-alt-blue-france)' : undefined
        }
        table={table}
        unvirtualized
        visibleRows={10}
      />
      <span aria-live="polite" className="fr-sr-only">
        {highlighted.announcement}
      </span>
    </SessionDocumentsTableContext.Provider>
  );
}
