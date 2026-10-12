import type { FoundSessionDocsDto } from '@api/types';

export type SessionDocument = FoundSessionDocsDto['items'][number];
export type AgendaDocument = Extract<SessionDocument, { type: 'agenda' }>;
export type OfficialReportDocument = Extract<SessionDocument, { type: 'officialReport' }>;
export type SessionDocumentGroup = readonly [SessionDocument, ...SessionDocument[]];

export const SESSION_DOCUMENT_GROUP_STATES = [
  'awaitingOfficialReport',
  'outdatedOfficialReport',
  'upToDate',
  'outdatedAgenda',
] as const;

export type SessionDocumentGroupState = (typeof SESSION_DOCUMENT_GROUP_STATES)[number];

function officialReportGroup(doc: SessionDocument) {
  return doc.type === 'agenda' ? (doc.officialReportId ?? doc.id) : doc.id;
}

export function groupSessionDocuments(
  docs: readonly SessionDocument[],
): [SessionDocument, ...SessionDocument[]][] {
  const groups = new Map<string, [SessionDocument, ...SessionDocument[]]>();
  for (const doc of docs) {
    const key = officialReportGroup(doc);
    const group = groups.get(key);
    if (group) group.push(doc);
    else groups.set(key, [doc]);
  }

  return [...groups.values()].map((group) =>
    group.sort((a, b) => (a.type === b.type ? 0 : a.type === 'agenda' ? -1 : 1)),
  );
}

export function sessionDocumentGroupState(
  group: readonly SessionDocument[],
): SessionDocumentGroupState | null {
  const officialReport = group.find((doc) => doc.type === 'officialReport');

  if (!officialReport) {
    // the server does let a draft be reported on, we just do not ask for it before it is finished
    const agenda = group.find((doc) => doc.type === 'agenda');
    return agenda?.status === 'DRAFT' ? null : 'awaitingOfficialReport';
  }

  return officialReport.outdated ? 'outdatedOfficialReport' : 'upToDate';
}

export function isSessionDocumentGroupState(value: string): value is SessionDocumentGroupState {
  return SESSION_DOCUMENT_GROUP_STATES.some((state) => state === value);
}

export function sessionDocumentStates(
  groups: readonly SessionDocumentGroup[],
): Map<string, SessionDocumentGroupState> {
  return new Map(
    groups.flatMap((group) => {
      let groupStateByItemIdEntries: [string, SessionDocumentGroupState][] = [];

      const agenda = group.find(({ type }) => type === 'agenda');
      if (agenda?.outdated) {
        groupStateByItemIdEntries.push([agenda.id, 'outdatedAgenda']);
      }

      const groupState = sessionDocumentGroupState(group);

      const officialReport = group.find((doc) => doc.type === 'officialReport');
      if (officialReport && groupState) {
        groupStateByItemIdEntries.push([officialReport.id, groupState]);
      }

      if (groupStateByItemIdEntries.length === 0 && groupState) {
        const [firstDoc] = group;
        groupStateByItemIdEntries.push([firstDoc.id, groupState]);
      }

      return groupStateByItemIdEntries;
    }),
  );
}
