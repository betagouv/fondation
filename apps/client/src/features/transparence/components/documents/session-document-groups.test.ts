import { describe, expect, it } from 'vitest';

import {
  groupSessionDocuments,
  sessionDocumentGroupState,
  type SessionDocument,
} from './session-document-groups';

const CREATED_AT = '2026-03-12T09:00:00.000Z';
const VALIDATED_AT = '2026-03-12T11:00:00.000Z';

const AGENDA_SIEGE: SessionDocument = {
  createdAt: CREATED_AT,
  hasDraft: false,
  id: 'agenda-siege',
  name: 'ODJ siège',
  officialReportId: 'pv-1',
  outdated: false,
  status: 'VALIDATED',
  type: 'agenda',
  validatedAt: VALIDATED_AT,
};
const AGENDA_PARQUET: SessionDocument = {
  createdAt: CREATED_AT,
  hasDraft: false,
  id: 'agenda-parquet',
  name: 'ODJ parquet',
  officialReportId: 'pv-1',
  outdated: false,
  status: 'VALIDATED',
  type: 'agenda',
  validatedAt: VALIDATED_AT,
};
const AGENDA_SANS_PV: SessionDocument = {
  createdAt: CREATED_AT,
  hasDraft: false,
  id: 'agenda-orphan',
  name: 'ODJ sans PV',
  officialReportId: null,
  outdated: false,
  status: 'VALIDATED',
  type: 'agenda',
  validatedAt: VALIDATED_AT,
};
const AGENDA_BROUILLON: SessionDocument = {
  ...AGENDA_SANS_PV,
  id: 'agenda-draft',
  name: 'ODJ jamais validé',
  status: 'DRAFT',
  validatedAt: null,
};
const PV: SessionDocument = {
  createdAt: CREATED_AT,
  id: 'pv-1',
  name: 'PV du 12 mars',
  outdated: false,
  type: 'officialReport',
  validatedAt: VALIDATED_AT,
};

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

  it('should await an official report from an agenda that has never been validated', () => {
    expect(sessionDocumentGroupState([AGENDA_BROUILLON])).toBe('awaitingOfficialReport');
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
