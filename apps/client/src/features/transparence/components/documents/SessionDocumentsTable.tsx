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

import { useSystemUpdateCauses } from '@/features/documents/hooks/useSystemUpdateCauses';
import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { NewTable } from '@/shared/ui/new-table';
import { compareDateOnly, formatLongDateOnly, type PlainDateOnly } from '@/utils/date-only.util';
import { useUser } from '@queries/auth.queries';

import {
  sessionDocumentGroupState,
  sessionDocumentStates,
  type AgendaDocument,
  type OfficialReportDocument,
  type SessionDocument,
  type SessionDocumentGroup,
  type SessionDocumentGroupState,
} from './session-document-groups';

export type { SessionDocument } from './session-document-groups';

export type Association = { agendasCount: number; associated: SessionDocument[] };

type SessionMeeting = {
  agendas: AgendaDocument[];
  id: string;
  meetingDate: PlainDateOnly;
  officialReport: OfficialReportDocument | undefined;
  state: SessionDocumentGroupState | null;
};

const h = createColumnHelper<SessionMeeting>();

export const SessionDocumentsTableContext = createContext<{
  actions?: (doc: SessionDocument) => ReactNode;
  associations?: ReadonlyMap<string, Association>;
  newOfficialReport?: (agenda: AgendaDocument) => ReactNode;
  renderName?: (doc: SessionDocument) => ReactNode;
  states?: ReadonlyMap<string, SessionDocumentGroupState>;
}>({});

function toSessionMeeting(group: SessionDocumentGroup): SessionMeeting {
  const agendas = group.filter((doc): doc is AgendaDocument => doc.type === 'agenda');
  const officialReport = group.find((doc): doc is OfficialReportDocument => doc.type === 'officialReport');
  const [first] = group;

  return {
    agendas,
    id: first.id,
    // the report takes its meeting date from its agenda, but can be moved away from it by hand
    meetingDate: (agendas[0] ?? first).meetingDate,
    officialReport,
    state: sessionDocumentGroupState(group),
  };
}

function Moment(props: { at: string }) {
  const dateAndTime = useDateAndTime();

  return (
    <span className="whitespace-nowrap">
      <FormattedMessage defaultMessage="{date} à {time}" values={dateAndTime(props.at)} />
    </span>
  );
}

/** a gesture whose author is unknown, the application or a person since gone, keeps only its date */
function useAuthorship() {
  const { user } = useUser();

  return (at: string, by: SessionDocument['createdBy']) => ({
    author: by?.name,
    moment: <Moment at={at} />,
    who: !by ? 'nobody' : by.id === user?.id ? 'self' : 'someone',
  });
}

function DocumentStatus(props: { doc: SessionDocument }) {
  const { doc } = props;

  if (!doc.validatedAt) {
    return (
      <Badge as="span" className="rounded-full" noIcon severity="new" small>
        <FormattedMessage defaultMessage="brouillon" />
      </Badge>
    );
  }

  if (doc.draftChangesBy) {
    // the "Validé le" line underneath tells these changes sit on top of a validated version
    return (
      <Badge as="span" className="rounded-full" noIcon severity="info" small>
        <FormattedMessage defaultMessage="modifications en cours" />
      </Badge>
    );
  }

  return (
    <Badge as="span" className="rounded-full" noIcon severity="success" small>
      <FormattedMessage defaultMessage="validé" />
    </Badge>
  );
}

function OutdatedDocument(props: { state: SessionDocumentGroupState | undefined }) {
  if (props.state !== 'outdatedOfficialReport' && props.state !== 'outdatedAgenda') return null;

  return (
    <Badge as="span" className="rounded-full" severity="warning" small>
      <FormattedMessage defaultMessage="À vérifier" />
    </Badge>
  );
}

function Trace(props: { children: ReactNode }) {
  return <span className="text-xs text-(--text-mention-grey)">{props.children}</span>;
}

function SessionDocumentItem(props: { doc: SessionDocument }) {
  const { actions, renderName, states } = useContext(SessionDocumentsTableContext);
  const authorship = useAuthorship();
  const systemUpdateCauses = useSystemUpdateCauses();
  const { doc } = props;

  return (
    <div className="flex w-full min-w-0 items-start justify-between gap-4 py-4">
      <div className="flex min-w-0 flex-col items-start gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0">{renderName?.(doc) ?? doc.name}</div>
          <DocumentStatus doc={doc} />
          <OutdatedDocument state={states?.get(doc.id)} />
        </div>
        {/* the file name carries no time, so two documents of the same day are told apart here */}
        <Trace>
          <FormattedMessage
            defaultMessage="Créé le {moment}{who, select, self { par vous} someone { par {author}} other {}}"
            values={authorship(doc.createdAt, doc.createdBy)}
          />
        </Trace>
        {doc.validatedAt && (
          <Trace>
            <FormattedMessage
              defaultMessage="Validé le {moment}{who, select, self { par vous} someone { par {author}} other {}}"
              values={authorship(doc.validatedAt, doc.validatedBy)}
            />
          </Trace>
        )}
        {doc.draftUpdate && (
          <Trace>
            {doc.draftUpdate.origin === 'SYSTEM' ? (
              <FormattedMessage
                defaultMessage="{count, plural, =0 {Mis à jour automatiquement le {moment}} =1 {Mis à jour automatiquement le {moment} suite {causes}} other {Mis à jour automatiquement suite {causes}, la dernière fois le {moment}}}"
                values={{
                  causes: systemUpdateCauses(doc.draftUpdate.causes),
                  count: doc.draftUpdate.causes.length,
                  moment: <Moment at={doc.draftUpdate.at} />,
                }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="Modifié le {moment}{who, select, self { par vous} someone { par {author}} other {}}"
                values={authorship(doc.draftUpdate.at, doc.draftUpdate.by)}
              />
            )}
          </Trace>
        )}
      </div>
      {actions?.(doc)}
    </div>
  );
}

function MeetingDateCell(props: CellContext<SessionMeeting, PlainDateOnly>) {
  return formatLongDateOnly(props.getValue());
}

function AgendasCell(props: CellContext<SessionMeeting, unknown>) {
  return (
    <div className="flex w-full flex-col divide-y divide-(--border-default-grey)">
      {props.row.original.agendas.map((agenda) => (
        <SessionDocumentItem doc={agenda} key={agenda.id} />
      ))}
    </div>
  );
}

function OfficialReportCell(props: CellContext<SessionMeeting, unknown>) {
  const { newOfficialReport } = useContext(SessionDocumentsTableContext);
  const { agendas, officialReport, state } = props.row.original;

  if (officialReport) return <SessionDocumentItem doc={officialReport} />;
  if (state !== 'awaitingOfficialReport') return null;

  const [agenda] = agendas;

  return (
    <div className="flex w-full flex-col items-center gap-3 py-4">
      <Badge as="span" className="rounded-full" noIcon severity="error" small>
        <FormattedMessage defaultMessage="pv attendu" />
      </Badge>
      {agenda && newOfficialReport?.(agenda)}
    </div>
  );
}

export function SessionDocumentsTable(props: {
  actions?: (doc: SessionDocument) => ReactNode;
  groups: readonly SessionDocumentGroup[];
  newOfficialReport?: (agenda: AgendaDocument) => ReactNode;
  renderName?: (doc: SessionDocument) => ReactNode;
  scrollsWithPage?: boolean;
}) {
  const { formatMessage } = useIntl();
  const { actions, groups, newOfficialReport, renderName } = props;

  const data = useMemo(() => groups.map(toSessionMeeting), [groups]);
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

  const renderers = useMemo(
    () => ({ actions, associations, newOfficialReport, renderName, states }),
    [actions, associations, newOfficialReport, renderName, states],
  );

  const columns = useMemo(
    () => [
      h.accessor('meetingDate', {
        cell: MeetingDateCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Séance de restitution' }),
        meta: {
          cellBackground: () => 'bg-(--background-alt-grey)',
          cellClassName: () => 'border-r border-(--border-default-grey)',
          headerClassName: 'border-r border-(--border-default-grey)',
        },
        size: 200,
        sortingFn: (a, b) => compareDateOnly(a.original.meetingDate, b.original.meetingDate),
      }),

      h.display({
        cell: AgendasCell,
        header: formatMessage({ defaultMessage: 'Ordre du jour' }),
        id: 'agendas',
        meta: {
          cellClassName: () => 'border-r border-(--border-default-grey) py-0!',
          headerClassName: 'border-r border-(--border-default-grey)',
        },
        size: 520,
      }),

      h.display({
        cell: OfficialReportCell,
        header: formatMessage({ defaultMessage: 'Procès-verbal' }),
        id: 'officialReport',
        meta: { cellClassName: () => 'py-0!' },
        size: 520,
      }),
    ],
    [formatMessage],
  );

  const table = useReactTable({
    columns,
    data,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ desc: true, id: 'meetingDate' }] },
  });

  return (
    <SessionDocumentsTableContext.Provider value={renderers}>
      <NewTable
        ariaLabel={formatMessage({ defaultMessage: 'Documents de la session' })}
        emptyLabel={formatMessage({ defaultMessage: 'Aucun document' })}
        fluid
        scrollsWithPage={props.scrollsWithPage}
        table={table}
        unvirtualized
        visibleRows={props.scrollsWithPage ? undefined : 10}
      />
    </SessionDocumentsTableContext.Provider>
  );
}
