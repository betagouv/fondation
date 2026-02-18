import { Magistrat } from 'shared-models';
import { DateOnly } from 'src/utils/date-only';
import {
  AutoAffectationMember,
  AutoAffectationNominationFile,
  AutoAffectations,
} from './auto-affectations';

describe('automated affectation', () => {
  const session = {
    formation: Magistrat.Formation.PARQUET,
    date: new DateOnly(2025, 12, 10),
  };

  it('should exclude a nomination file, when targeting the same jurisdiction as the member', () => {
    const member = AutoAffectationMember.from({
      session,
      id: 'memberId',
      excludedJurisdictions: new Set(['CA  RENNES']),
      affectationCountPerGrade: new Map(),
    });

    const file: AutoAffectationNominationFile =
      AutoAffectationNominationFile.from({
        id: 'nominationSessionFileId',
        targetedJurisdiction: 'CA  RENNES',
        targetedGrade: Magistrat.Grade.G2,
        session,
        currentJurisdiction: 'CA RENNES',
        number: 1,
      });

    expect(member.canReportOn(file)).toBe(false);
  });

  it('should allow a nomination file, when the jurisdiction is not defined', () => {
    const member = AutoAffectationMember.from({
      session,
      excludedJurisdictions: null,
      affectationCountPerGrade: new Map(),
      id: 'memberId',
    });

    const file = AutoAffectationNominationFile.from({
      session,
      id: 'nominationSessionFileId',
      targetedJurisdiction: 'CA RENNES',
      targetedGrade: Magistrat.Grade.G2,
      currentJurisdiction: 'CA RENNES',
      number: 1,
    });

    expect(member.canReportOn(file)).toBe(true);
  });

  it('should allow a nomination file, when targeting a different jurisdiction than the member', () => {
    const member = AutoAffectationMember.from({
      session,
      excludedJurisdictions: new Set(['CA  RENNES']),
      affectationCountPerGrade: new Map(),
      id: 'memberId',
    });

    const file = AutoAffectationNominationFile.from({
      session,
      id: 'nominationSessionFileId',
      targetedJurisdiction: 'TGI RENNES',
      targetedGrade: Magistrat.Grade.G2,
      currentJurisdiction: 'TGI RENNES',
      number: 1,
    });

    expect(member.canReportOn(file)).toBe(true);
  });

  it('should exclude a nomination file from a different formation than the member', () => {
    const member = AutoAffectationMember.from({
      session: { ...session, formation: Magistrat.Formation.SIEGE },
      excludedJurisdictions: new Set(['CA  RENNES']),
      affectationCountPerGrade: new Map(),
      id: 'memberId',
    });

    const file = AutoAffectationNominationFile.from({
      session,
      id: 'nominationSessionFileId',
      targetedJurisdiction: 'TGI RENNES',
      targetedGrade: Magistrat.Grade.G2,
      currentJurisdiction: 'TGI RENNES',
      number: 1,
    });

    expect(member.canReportOn(file)).toBe(false);
  });

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

    const affectation = result.find(
      ({ nominationFileId }) => nominationFileId === file.id,
    );

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

    // prettier-ignore
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

    // prettier-ignore
    {
      expect(result).toContainEqual({ nominationFileId: 'file-1', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-2', reporterIds: ['memberId1'] });

      expect(result).toContainEqual({ nominationFileId: 'file-3', reporterIds: ['memberId2'] });
      expect(result).toContainEqual({ nominationFileId: 'file-4', reporterIds: ['memberId2'] });

      expect(result).toContainEqual({ nominationFileId: 'file-5', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-6', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-7', reporterIds: ['memberId2'] });
    }

    expect(members).toContainEqual(
      expect.objectContaining({ id: 'memberId1', workload: { value: 10 } }),
    );
    expect(members).toContainEqual(
      expect.objectContaining({ id: 'memberId2', workload: { value: 8 } }),
    );
  });

  it('should distribute between members, even if a lighter distribution exists', () => {
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
      AutoAffectationMember.from({
        session,
        id: 'memberId3',
        excludedJurisdictions: null,
        affectationCountPerGrade: new Map(),
      }),
    ];

    // prettier-ignore
    const files: AutoAffectationNominationFile[] = [
      AutoAffectationNominationFile.from({ id: 'file-1', targetedGrade: Magistrat.Grade.G1, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 1, session }),
      AutoAffectationNominationFile.from({ id: 'file-2', targetedGrade: Magistrat.Grade.G1, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 2, session }),
      AutoAffectationNominationFile.from({ id: 'file-3', targetedGrade: Magistrat.Grade.G1, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 3, session }),
      AutoAffectationNominationFile.from({ id: 'file-4', targetedGrade: Magistrat.Grade.G1, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 4, session }),
      AutoAffectationNominationFile.from({ id: 'file-5', targetedGrade: Magistrat.Grade.G1, targetedJurisdiction: 'CA  RENNES', currentJurisdiction: 'CA  RENNES', number: 5, session }),
    ];

    const autoAffectations = AutoAffectations.from({ members, files });
    const result = autoAffectations.distribute();

    // prettier-ignore
    {
      expect(result).toContainEqual({ nominationFileId: 'file-1', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-2', reporterIds: ['memberId1'] });

      expect(result).toContainEqual({ nominationFileId: 'file-3', reporterIds: ['memberId3'] });
      expect(result).toContainEqual({ nominationFileId: 'file-4', reporterIds: ['memberId3'] });

      // Here memberId2 has a huge workload, but we still want this distribution 
      expect(result).toContainEqual({ nominationFileId: 'file-5', reporterIds: ['memberId2'] });
    }
  });
});
