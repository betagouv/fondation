import { describe, expect, it } from 'vitest';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';

import { MemberExcludedJurisdictions } from './member-excluded-jurisdictions';

const LYON = { id: 'CA  LYON', label: "Cour d'appel de Lyon" };
const PARIS = { id: 'CA  PARIS', label: "Cour d'appel de Paris" };
const RENNES = { id: 'CA  RENNES', label: "Cour d'appel de Rennes" };

const honorine = {
  excludedJurisdictions: [LYON],
  firstName: 'Honorine',
  id: 'honorine',
  lastName: 'Valrose',
};

describe('MemberExcludedJurisdictions', () => {
  it('reports a member excluded from the targeted jurisdiction', () => {
    const file = makeSessionNominationFile({
      content: { jurisdictions: { current: null, targeted: LYON }, numeroDeDossier: 12 },
      id: 'file',
    });

    const model = MemberExcludedJurisdictions.fromMembers([honorine]);

    expect(model.conflictsFor(file, ['honorine'])).toEqual([
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
      content: { jurisdictions: { current: LYON, targeted: PARIS } },
    });

    expect(MemberExcludedJurisdictions.fromMembers([honorine]).conflictsFor(file, ['honorine'])).toHaveLength(
      1,
    );
  });

  it('ignores members that are not affected to the file', () => {
    const file = makeSessionNominationFile({
      content: { jurisdictions: { current: LYON, targeted: null } },
    });

    expect(MemberExcludedJurisdictions.fromMembers([honorine]).conflictsFor(file, [])).toEqual([]);
  });

  it('ignores a file outside of any excluded jurisdiction', () => {
    const file = makeSessionNominationFile({
      content: { jurisdictions: { current: PARIS, targeted: RENNES } },
    });

    expect(MemberExcludedJurisdictions.fromMembers([honorine]).conflictsFor(file, ['honorine'])).toEqual([]);
  });

  it('reports one conflict per excluded jurisdiction of the file', () => {
    const file = makeSessionNominationFile({
      content: { jurisdictions: { current: LYON, targeted: RENNES } },
    });

    const model = MemberExcludedJurisdictions.fromMembers([
      { ...honorine, excludedJurisdictions: [LYON, RENNES] },
    ]);

    expect(model.conflictsFor(file, ['honorine']).map(({ jurisdiction }) => jurisdiction)).toEqual([
      "Cour d'appel de Lyon",
      "Cour d'appel de Rennes",
    ]);
  });

  it('reports a single conflict when the current and targeted jurisdictions are the same', () => {
    const file = makeSessionNominationFile({
      content: { jurisdictions: { current: LYON, targeted: LYON } },
    });

    expect(MemberExcludedJurisdictions.fromMembers([honorine]).conflictsFor(file, ['honorine'])).toHaveLength(
      1,
    );
  });

  it('falls back to the member exclusion label when the file jurisdiction has none', () => {
    const file = makeSessionNominationFile({
      content: { jurisdictions: { current: { id: LYON.id, label: null }, targeted: null } },
    });

    expect(
      MemberExcludedJurisdictions.fromMembers([honorine])
        .conflictsFor(file, ['honorine'])
        .map(({ jurisdiction }) => jurisdiction),
    ).toEqual(["Cour d'appel de Lyon"]);
  });
});
