import { describe, expect, it } from 'vitest';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';

import { findExcludedJurisdictionConflicts } from './useExcludedJurisdictionConflicts.hook';

const honorine = {
  excludedJurisdictions: [{ id: 'CA  LYON', label: "Cour d'appel de Lyon" }],
  firstName: 'Honorine',
  id: 'honorine',
  lastName: 'Valrose',
};

describe('findExcludedJurisdictionConflicts', () => {
  it('reports a member excluded from the targeted jurisdiction', () => {
    const file = makeSessionNominationFile({
      id: 'file',
      content: { jurisdictions: { current: null, targeted: 'CA  LYON' }, numeroDeDossier: 12 },
    });

    expect(
      findExcludedJurisdictionConflicts({
        files: [file],
        memberIds: ['honorine'],
        members: [honorine],
      }),
    ).toEqual([
      {
        fileId: 'file',
        fileNumber: 12,
        jurisdiction: "Cour d'appel de Lyon",
        memberId: 'honorine',
        memberName: 'Honorine VALROSE',
      },
    ]);
  });

  it('reports a member excluded from the current jurisdiction', () => {
    const file = makeSessionNominationFile({
      content: { jurisdictions: { current: 'CA  LYON', targeted: 'CA  PARIS' } },
    });

    expect(
      findExcludedJurisdictionConflicts({ files: [file], memberIds: ['honorine'], members: [honorine] }),
    ).toHaveLength(1);
  });

  it('ignores members that are not affected to the file', () => {
    const file = makeSessionNominationFile({
      content: { jurisdictions: { current: 'CA  LYON', targeted: null } },
    });

    expect(findExcludedJurisdictionConflicts({ files: [file], memberIds: [], members: [honorine] })).toEqual(
      [],
    );
  });

  it('ignores a file outside of any excluded jurisdiction', () => {
    const file = makeSessionNominationFile({
      content: { jurisdictions: { current: 'CA  PARIS', targeted: 'CA  RENNES' } },
    });

    expect(
      findExcludedJurisdictionConflicts({ files: [file], memberIds: ['honorine'], members: [honorine] }),
    ).toEqual([]);
  });

  it('reports one conflict per excluded jurisdiction of the file', () => {
    const file = makeSessionNominationFile({
      content: { jurisdictions: { current: 'CA  LYON', targeted: 'CA  RENNES' } },
    });

    expect(
      findExcludedJurisdictionConflicts({
        files: [file],
        memberIds: ['honorine'],
        members: [
          {
            ...honorine,
            excludedJurisdictions: [
              { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
              { id: 'CA  RENNES', label: "Cour d'appel de Rennes" },
            ],
          },
        ],
      }).map(({ jurisdiction }) => jurisdiction),
    ).toEqual(["Cour d'appel de Lyon", "Cour d'appel de Rennes"]);
  });
});
