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
  createdBy: null,
  draftChangesBy: null,
  draftUpdate: null,
  id: 'agenda-siege',
  meetingDate: { day: 12, month: 3, year: 2028 },
  name: 'ODJ siège',
  officialReportId: 'pv-1',
  officialReportReadiness: null,
  outdated: false,
  presentationPlans: [],
  status: 'VALIDATED',
  type: 'agenda',
  validatedAt: VALIDATED_AT,
  validatedBy: null,
};
const AGENDA_PARQUET: SessionDocument = {
  createdAt: CREATED_AT,
  createdBy: null,
  draftChangesBy: null,
  draftUpdate: null,
  id: 'agenda-parquet',
  meetingDate: { day: 12, month: 3, year: 2028 },
  name: 'ODJ parquet',
  officialReportId: 'pv-1',
  officialReportReadiness: null,
  outdated: false,
  presentationPlans: [],
  status: 'VALIDATED',
  type: 'agenda',
  validatedAt: VALIDATED_AT,
  validatedBy: null,
};
const AGENDA_SANS_PV: SessionDocument = {
  createdAt: CREATED_AT,
  createdBy: null,
  draftChangesBy: null,
  draftUpdate: null,
  id: 'agenda-orphan',
  meetingDate: { day: 12, month: 3, year: 2028 },
  name: 'ODJ sans PV',
  officialReportId: null,
  officialReportReadiness: { status: 'READY' },
  outdated: false,
  presentationPlans: [],
  status: 'VALIDATED',
  type: 'agenda',
  validatedAt: VALIDATED_AT,
  validatedBy: null,
};
const AGENDA_BROUILLON: SessionDocument = {
  ...AGENDA_SANS_PV,
  id: 'agenda-draft',
  meetingDate: { day: 12, month: 3, year: 2028 },
  name: 'ODJ jamais validé',
  status: 'DRAFT',
  validatedAt: null,
  validatedBy: null,
};
const PV: SessionDocument = {
  createdAt: CREATED_AT,
  createdBy: null,
  draftChangesBy: null,
  draftUpdate: null,
  id: 'pv-1',
  meetingDate: { day: 12, month: 3, year: 2028 },
  name: 'PV du 12 mars',
  outdated: false,
  status: 'VALIDATED',
  type: 'officialReport',
  validatedAt: VALIDATED_AT,
  validatedBy: null,
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

  it('should await nothing from an agenda that has never been validated', () => {
    expect(sessionDocumentGroupState([AGENDA_BROUILLON])).toBeNull();
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
