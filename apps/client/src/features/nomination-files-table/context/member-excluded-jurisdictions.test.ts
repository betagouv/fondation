import { describe, expect, it } from 'vitest';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';

import { excludedJurisdictionConflictsOf } from './member-excluded-jurisdictions';

const LYON = { id: 'CA  LYON', label: "Cour d'appel de Lyon" };

const honorine = { firstName: 'Honorine', id: 'honorine', lastName: 'Valrose' };

describe('excludedJurisdictionConflictsOf', () => {
  it('reports the conflict the API serves for a member of the list', () => {
    const file = makeSessionNominationFile({
      content: { numeroDeDossier: 12 },
      excludedJurisdictionConflicts: [{ jurisdiction: LYON, member: honorine }],
      id: 'file',
    });

    expect(excludedJurisdictionConflictsOf(file, ['honorine'])).toEqual([
      {
        fileId: 'file',
        fileNumber: 12,
        jurisdiction: "Cour d'appel de Lyon",
        memberId: 'honorine',
        memberName: 'Honorine VALROSE',
      },
    ]);
  });

  it('ignores the members outside of the list', () => {
    const file = makeSessionNominationFile({
      excludedJurisdictionConflicts: [{ jurisdiction: LYON, member: honorine }],
    });

    expect(excludedJurisdictionConflictsOf(file, [])).toEqual([]);
  });

  it('names the jurisdiction by its code when it has no label', () => {
    const file = makeSessionNominationFile({
      excludedJurisdictionConflicts: [{ jurisdiction: { id: LYON.id, label: null }, member: honorine }],
    });

    expect(
      excludedJurisdictionConflictsOf(file, ['honorine']).map(({ jurisdiction }) => jurisdiction),
    ).toEqual([LYON.id]);
  });
});
