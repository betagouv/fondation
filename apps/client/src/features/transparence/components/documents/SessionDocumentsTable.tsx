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

export type Association = { agendasCount: number; associated: SessionDocument[] };

const h = createColumnHelper<SessionDocument>();

export const SessionDocumentsTableContext = createContext<{
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

  if (props.state === 'outdatedOfficialReport' || props.state === 'outdatedAgenda') {
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

function Moment(props: { at: string }) {
  const { formatDate, formatTime } = useIntl();

  return (
    <span className="whitespace-nowrap">
      <FormattedMessage
        defaultMessage="{date} à {time}"
        values={{
          date: formatDate(props.at, { format: 'zonedDateShort' }),
          time: formatTime(props.at, { format: 'zonedTimeShort' }),
        }}
      />
    </span>
  );
}

/** the file name carries no time, so two documents of the same day are told apart here */
function CreatedAtCell(props: CellContext<SessionDocument, unknown>) {
  return <Moment at={props.row.original.createdAt} />;
}

function ValidatedAtCell(props: CellContext<SessionDocument, unknown>) {
  const { validatedAt } = props.row.original;
  return validatedAt ? <Moment at={validatedAt} /> : null;
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
  const state = states?.get(doc.id);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {!doc.validatedAt ? (
        <Badge as="span" className="rounded-full" noIcon severity="new" small>
          <FormattedMessage defaultMessage="brouillon" />
        </Badge>
      ) : doc.draftChangesBy ? (
        // who opened the draft, a person or the application, is told on the document itself
        <Badge as="span" className="rounded-full" noIcon severity="info" small>
          <FormattedMessage defaultMessage="modifications en cours" />
        </Badge>
      ) : (
        <Badge as="span" className="rounded-full" noIcon severity="success" small>
          <FormattedMessage defaultMessage="validé" />
        </Badge>
      )}
      <DocumentState state={state} />
      {association && <AssociationLink association={association} doc={doc} />}
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
  scrollsWithPage?: boolean;
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
        size: 150,
      }),

      h.accessor('name', {
        cell: NameCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Nom du document' }),
        size: 260,
      }),

      h.accessor('createdAt', {
        cell: CreatedAtCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Créé le' }),
        size: 190,
      }),

      h.accessor('validatedAt', {
        cell: ValidatedAtCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Validé le' }),
        size: 190,
      }),

      h.display({
        cell: StateCell,
        header: formatMessage({ defaultMessage: 'État' }),
        id: 'state',
        size: 290,
      }),

      h.display({
        cell: ActionsCell,
        header: formatMessage({ defaultMessage: 'Actions' }),
        id: 'actions',
        size: 190,
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
        scrollsWithPage={props.scrollsWithPage}
        table={table}
        unvirtualized
        visibleRows={props.scrollsWithPage ? undefined : 10}
      />
      <span aria-live="polite" className="fr-sr-only">
        {highlighted.announcement}
      </span>
    </SessionDocumentsTableContext.Provider>
  );
}
