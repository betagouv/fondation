import type { FoundSessionDocsDto } from '@api/types';

export type SessionDocument = FoundSessionDocsDto['items'][number];

const DOC_GROUP_STATES = ['awaitingOfficialReport', 'outdatedOfficialReport', 'upToDate'] as const;

export type SessionDocumentGroupState = (typeof DOC_GROUP_STATES)[number];

export const SESSION_DOCUMENT_GROUP_STATES: readonly SessionDocumentGroupState[] = DOC_GROUP_STATES;

export function officialReportGroup(doc: SessionDocument) {
  return doc.type === 'agenda' ? (doc.officialReportId ?? doc.id) : doc.id;
}

export function groupSessionDocuments(docs: readonly SessionDocument[]): SessionDocument[][] {
  const groups = Map.groupBy(docs, officialReportGroup);
  return [...groups.values()].map((group) =>
    [...group].sort((a, b) => (a.type === b.type ? 0 : a.type === 'agenda' ? -1 : 1)),
  );
}

export function sessionDocumentGroupState(group: readonly SessionDocument[]): SessionDocumentGroupState {
  const officialReport = group.find((doc) => doc.type === 'officialReport');
  if (!officialReport) return 'awaitingOfficialReport';
  return officialReport.outdated ? 'outdatedOfficialReport' : 'upToDate';
}
