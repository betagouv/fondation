import { Magistrat } from 'shared-models';

import { DateOnly } from 'src/utils/date-only';

import { AutoAffectationMember } from './auto-affectation-member';
import { AutoAffectationNominationFile } from './auto-affectation-nomination-file';
import { AutoAffectations } from './auto-affectations';

describe('automated affectation', () => {
  const session = {
    formation: Magistrat.Formation.PARQUET,
    date: new DateOnly(2025, 12, 10),
  };

  it('should use the report contributions count to auto affect members to nomination files', () => {
    const members = [
      AutoAffectationMember.from({
        session,
        excludedJurisdictions: new Set(['CA  RENNES']),
        affectationCountPerGrade: new Map([[Magistrat.Grade.G1, 10]]),
        id: 'memberId',
      }),
      AutoAffectationMember.from({
        session,
        excludedJurisdictions: new Set(['CA  STRASBOURG']),
        affectationCountPerGrade: new Map([[Magistrat.Grade.G1, 5]]),
        id: 'memberId2',
      }),
      AutoAffectationMember.from({
        session,
        excludedJurisdictions: new Set(['CA  LYON']),
        affectationCountPerGrade: new Map(),
        id: 'memberId3',
      }),
    ];

    const file = AutoAffectationNominationFile.from({
      session,
      id: 'nominationSessionFileId',
      targetedJurisdiction: 'TGI  NANTES',
      targetedGrade: Magistrat.Grade.G2,
      currentJurisdiction: 'TGI NANTES',
      number: 1,
    });

    const result = AutoAffectations.from({
      files: [file],
      members: [...members],
    }).distribute();

    const affectation = result.find(({ nominationFileId }) => nominationFileId === file.id);

    expect(affectation).toEqual({
      nominationFileId: 'nominationSessionFileId',
      reporterIds: ['memberId3'],
    });
  });

  it('should distribute nomination files by grade between members', () => {
    const members = [
      AutoAffectationMember.from({
        session,
        id: 'memberId1',
        excludedJurisdictions: null,
        affectationCountPerGrade: new Map(),
      }),
      AutoAffectationMember.from({
        session,
        id: 'memberId2',
        excludedJurisdictions: null,
        affectationCountPerGrade: new Map(),
      }),
    ];

    // oxfmt-ignore
    const files: AutoAffectationNominationFile[] = [
      AutoAffectationNominationFile.from({ id: 'file-1', targetedGrade: Magistrat.Grade.G3SUP, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 1, session }),
      AutoAffectationNominationFile.from({ id: 'file-2', targetedGrade: Magistrat.Grade.G3SUP, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 2, session }),
      AutoAffectationNominationFile.from({ id: 'file-3', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 3, session }),
      AutoAffectationNominationFile.from({ id: 'file-4', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 4, session }),

      AutoAffectationNominationFile.from({ id: 'file-5', targetedGrade: Magistrat.Grade.G2, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 5, session }),
      AutoAffectationNominationFile.from({ id: 'file-6', targetedGrade: Magistrat.Grade.G2, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 6, session }),
      AutoAffectationNominationFile.from({ id: 'file-7', targetedGrade: Magistrat.Grade.G2, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 7, session }),
    ];

    const autoAffectations = AutoAffectations.from({ members, files });
    const result = autoAffectations.distribute();

    // oxfmt-ignore
    {
      expect(result).toContainEqual({ nominationFileId: 'file-1', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-2', reporterIds: ['memberId1'] });

      expect(result).toContainEqual({ nominationFileId: 'file-3', reporterIds: ['memberId2'] });
      expect(result).toContainEqual({ nominationFileId: 'file-4', reporterIds: ['memberId2'] });

      expect(result).toContainEqual({ nominationFileId: 'file-5', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-6', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-7', reporterIds: ['memberId2'] });
    }
  });

  it('should affect the same number of files to members, despite their workload', () => {
    const members = [
      AutoAffectationMember.from({
        session,
        id: 'memberId1',
        excludedJurisdictions: null,
        affectationCountPerGrade: new Map(),
      }),
      AutoAffectationMember.from({
        session,
        id: 'memberId2',
        excludedJurisdictions: null,
        affectationCountPerGrade: new Map([[Magistrat.Grade.G3SUP, 3]]),
      }),
    ];

    // oxfmt-ignore
    const files: AutoAffectationNominationFile[] = [
      AutoAffectationNominationFile.from({ id: 'file-1', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 1, session }),
      AutoAffectationNominationFile.from({ id: 'file-2', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 2, session }),
      AutoAffectationNominationFile.from({ id: 'file-3', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 3, session }),

      AutoAffectationNominationFile.from({ id: 'file-4', targetedGrade: Magistrat.Grade.G2, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 4, session }),
      AutoAffectationNominationFile.from({ id: 'file-5', targetedGrade: Magistrat.Grade.G2, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 5, session }),

      AutoAffectationNominationFile.from({ id: 'file-7', targetedGrade: Magistrat.Grade.G1, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 7, session }),
      AutoAffectationNominationFile.from({ id: 'file-8', targetedGrade: Magistrat.Grade.G1, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 8, session }),
    ];

    const autoAffectations = AutoAffectations.from({ members, files });
    const result = autoAffectations.distribute();

    // oxfmt-ignore
    {
      expect(result).toContainEqual({ nominationFileId: 'file-1', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-2', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-3', reporterIds: ['memberId2'] });

      expect(result).toContainEqual({ nominationFileId: 'file-4', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-5', reporterIds: ['memberId2'] });

      expect(result).toContainEqual({ nominationFileId: 'file-7', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-8', reporterIds: ['memberId2'] });
    }
  });

  it('should not affect anyone if no jurisdiction is compatible', () => {
    const members = [
      AutoAffectationMember.from({
        session,
        id: 'memberId1',
        excludedJurisdictions: new Set(['CA  NANTES']),
        affectationCountPerGrade: new Map(),
      }),
      AutoAffectationMember.from({
        session,
        id: 'memberId2',
        excludedJurisdictions: new Set(['CA  NANTES']),
        affectationCountPerGrade: new Map(),
      }),
    ];

    // oxfmt-ignore
    const files: AutoAffectationNominationFile[] = [
      AutoAffectationNominationFile.from({ id: 'file-1', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  NANTES', currentJurisdiction: 'CA  RENNES', number: 1, session }),
    ];

    const autoAffectations = AutoAffectations.from({ members, files });
    const result = autoAffectations.distribute();

    expect(result).toEqual([]);
  });

  it('should ignore non affectable files', () => {
    const members = [
      AutoAffectationMember.from({
        session,
        id: 'memberId1',
        excludedJurisdictions: new Set(['CA  NANTES']),
        affectationCountPerGrade: new Map(),
      }),
      AutoAffectationMember.from({
        session,
        id: 'memberId2',
        excludedJurisdictions: new Set(['CA  NANTES']),
        affectationCountPerGrade: new Map(),
      }),
    ];

    // oxfmt-ignore
    const files: AutoAffectationNominationFile[] = [
      AutoAffectationNominationFile.from({ id: 'file-1', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  LYON', currentJurisdiction: 'CA  RENNES', number: 1, session }),
      AutoAffectationNominationFile.from({ id: 'file-2', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  NANTES', currentJurisdiction: 'CA  RENNES', number: 2, session }),
      AutoAffectationNominationFile.from({ id: 'file-3', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  STRASBOURG', currentJurisdiction: 'CA  RENNES', number: 3, session }),
      AutoAffectationNominationFile.from({ id: 'file-4', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  LYON', currentJurisdiction: 'CA  RENNES', number: 4, session }),
    ];

    const autoAffectations = AutoAffectations.from({ members, files });
    const result = autoAffectations.distribute();

    expect(result).toEqual([
      { nominationFileId: 'file-1', reporterIds: ['memberId1'] },
      { nominationFileId: 'file-3', reporterIds: ['memberId1'] },
      { nominationFileId: 'file-4', reporterIds: ['memberId2'] },
    ]);
  });

  it('should exchanges files between members in case of jurisdiction exclusion', () => {
    const members = [
      AutoAffectationMember.from({
        session,
        id: 'memberId1',
        excludedJurisdictions: new Set([]),
        affectationCountPerGrade: new Map(),
      }),
      AutoAffectationMember.from({
        session,
        id: 'memberId2',
        excludedJurisdictions: new Set(['CA  STRASBOURG']),
        affectationCountPerGrade: new Map(),
      }),
    ];

    // oxfmt-ignore
    const files: AutoAffectationNominationFile[] = [
      AutoAffectationNominationFile.from({ id: 'file-1', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  LYON', currentJurisdiction: 'CA  RENNES', number: 1, session }),
      AutoAffectationNominationFile.from({ id: 'file-2', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  NANTES', currentJurisdiction: 'CA  RENNES', number: 2, session }),
      AutoAffectationNominationFile.from({ id: 'file-3', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  STRASBOURG', currentJurisdiction: 'CA  RENNES', number: 3, session }),
      AutoAffectationNominationFile.from({ id: 'file-4', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  LYON', currentJurisdiction: 'CA  RENNES', number: 4, session }),
    ];

    const autoAffectations = AutoAffectations.from({ members, files });
    const result = autoAffectations.distribute();

    expect(result).toEqual([
      { nominationFileId: 'file-3', reporterIds: ['memberId1'] },
      { nominationFileId: 'file-4', reporterIds: ['memberId1'] },
      { nominationFileId: 'file-1', reporterIds: ['memberId2'] },
      { nominationFileId: 'file-2', reporterIds: ['memberId2'] },
    ]);
  });

  it('should exchanges files between members in case of jurisdiction exclusion for the first member', () => {
    const members = [
      AutoAffectationMember.from({
        session,
        id: 'memberId1',
        excludedJurisdictions: new Set(['CA  NANTES']),
        affectationCountPerGrade: new Map(),
      }),
      AutoAffectationMember.from({
        session,
        id: 'memberId2',
        excludedJurisdictions: new Set([]),
        affectationCountPerGrade: new Map(),
      }),
    ];

    // oxfmt-ignore
    const files: AutoAffectationNominationFile[] = [
      AutoAffectationNominationFile.from({ id: 'file-1', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  LYON', currentJurisdiction: 'CA  RENNES', number: 1, session }),
      AutoAffectationNominationFile.from({ id: 'file-2', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  NANTES', currentJurisdiction: 'CA  RENNES', number: 2, session }),
      AutoAffectationNominationFile.from({ id: 'file-3', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  STRASBOURG', currentJurisdiction: 'CA  RENNES', number: 3, session }),
      AutoAffectationNominationFile.from({ id: 'file-4', targetedGrade: Magistrat.Grade.G3, targetedJurisdiction: 'CA  LYON', currentJurisdiction: 'CA  RENNES', number: 4, session }),
    ];

    const autoAffectations = AutoAffectations.from({ members, files });
    const result = autoAffectations.distribute();

    expect(result).toEqual([
      { nominationFileId: 'file-3', reporterIds: ['memberId1'] },
      { nominationFileId: 'file-4', reporterIds: ['memberId1'] },
      { nominationFileId: 'file-1', reporterIds: ['memberId2'] },
      { nominationFileId: 'file-2', reporterIds: ['memberId2'] },
    ]);
  });

  it('should handle large affectations', () => {
    const members = Array.from({ length: 18 }).map((_, i) =>
      AutoAffectationMember.from({
        session,
        id: `memberId${i + 1}`,
        excludedJurisdictions: new Set(),
        affectationCountPerGrade: new Map(),
      }),
    );

    const files = Array.from({ length: 65 }).map((_, i) =>
      // oxfmt-ignore
      AutoAffectationNominationFile.from({ id: `file-${i + 1}`, targetedGrade: Magistrat.Grade.G2, targetedJurisdiction: 'CA  LYON', currentJurisdiction: 'CA  LYON', number: i + 1, session }),
    );

    const autoAffectations = AutoAffectations.from({ members, files });
    const result = autoAffectations.distribute();

    const perMember = result.reduce(
      (member, { reporterIds }) => ({
        ...member,
        [reporterIds[0]!]: (member[reporterIds[0]!] ?? 0) + 1,
      }),
      {} as Record<string, number>,
    );

    expect(perMember['memberId1']).toBe(4);
    expect(perMember['memberId2']).toBe(4);
    expect(perMember['memberId3']).toBe(4);
    expect(perMember['memberId4']).toBe(4);
    expect(perMember['memberId5']).toBe(4);
    expect(perMember['memberId6']).toBe(4);
    expect(perMember['memberId7']).toBe(4);
    expect(perMember['memberId8']).toBe(4);
    expect(perMember['memberId9']).toBe(4);
    expect(perMember['memberId10']).toBe(4);
    expect(perMember['memberId11']).toBe(4);

    expect(perMember['memberId12']).toBe(3);
    expect(perMember['memberId13']).toBe(3);
    expect(perMember['memberId14']).toBe(3);
    expect(perMember['memberId15']).toBe(3);
    expect(perMember['memberId16']).toBe(3);
    expect(perMember['memberId17']).toBe(3);
    expect(perMember['memberId18']).toBe(3);
  });
});
