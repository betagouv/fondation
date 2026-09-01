import { describe, expect, it } from 'vitest';

import {
  groupSessionDocuments,
  sessionDocumentGroupState,
  type SessionDocument,
} from './session-document-groups';

const AGENDA_SIEGE: SessionDocument = {
  id: 'agenda-siege',
  type: 'agenda',
  name: 'ODJ siège',
  officialReportId: 'pv-1',
};
const AGENDA_PARQUET: SessionDocument = {
  id: 'agenda-parquet',
  type: 'agenda',
  name: 'ODJ parquet',
  officialReportId: 'pv-1',
};
const AGENDA_SANS_PV: SessionDocument = {
  id: 'agenda-orphan',
  type: 'agenda',
  name: 'ODJ sans PV',
  officialReportId: null,
};
const PV: SessionDocument = { id: 'pv-1', type: 'officialReport', name: 'PV du 12 mars', outdated: false };

describe('groupSessionDocuments', () => {
  it('should gather an official report with every agenda it covers', () => {
    const groups = groupSessionDocuments([AGENDA_SIEGE, AGENDA_SANS_PV, AGENDA_PARQUET, PV]);

    expect(groups).toEqual([[AGENDA_SIEGE, AGENDA_PARQUET, PV], [AGENDA_SANS_PV]]);
  });

  it('should keep the official report after its agendas', () => {
    const groups = groupSessionDocuments([PV, AGENDA_SIEGE]);

    expect(groups).toEqual([[AGENDA_SIEGE, PV]]);
  });
});

describe('sessionDocumentGroupState', () => {
  it('should await an official report as long as none covers the agenda', () => {
    expect(sessionDocumentGroupState([AGENDA_SANS_PV])).toBe('awaitingOfficialReport');
  });

  it('should ask to check an outdated official report', () => {
    expect(sessionDocumentGroupState([AGENDA_SIEGE, { ...PV, outdated: true }])).toBe(
      'outdatedOfficialReport',
    );
  });

  it('should be up to date once the official report is', () => {
    expect(sessionDocumentGroupState([AGENDA_SIEGE, PV])).toBe('upToDate');
  });
});
