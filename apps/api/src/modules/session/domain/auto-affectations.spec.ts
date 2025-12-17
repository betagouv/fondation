import { Magistrat } from 'shared-models';
import {
  AutoAffectations,
  AutoAffectationNominationFile,
  AutoAffectationMember,
} from './auto-affectations';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';

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
      pastReportCountPerGrade: new Map(),
    });

    const file: AutoAffectationNominationFile =
      AutoAffectationNominationFile.from({
        id: 'nominationSessionFileId',
        targetJurisdiction: 'CA  RENNES',
        targetedGrade: Magistrat.Grade.II,
        session,
      });

    expect(member.canReportOn(file)).toBe(false);
  });

  it('should allow a nomination file, when the jurisdiction is not defined', () => {
    const member = AutoAffectationMember.from({
      session,
      excludedJurisdictions: null,
      pastReportCountPerGrade: new Map(),
      id: 'memberId',
    });

    const file = AutoAffectationNominationFile.from({
      session,
      id: 'nominationSessionFileId',
      targetJurisdiction: 'CA RENNES',
      targetedGrade: Magistrat.Grade.II,
    });

    expect(member.canReportOn(file)).toBe(true);
  });

  it('should allow a nomination file, when targeting a different jurisdiction than the member', () => {
    const member = AutoAffectationMember.from({
      session,
      excludedJurisdictions: new Set(['CA  RENNES']),
      pastReportCountPerGrade: new Map(),
      id: 'memberId',
    });

    const file = AutoAffectationNominationFile.from({
      session,
      id: 'nominationSessionFileId',
      targetJurisdiction: 'TGI RENNES',
      targetedGrade: Magistrat.Grade.II,
    });

    expect(member.canReportOn(file)).toBe(true);
  });

  it('should exclude a nomination file from a different formation than the member', () => {
    const member = AutoAffectationMember.from({
      session: { ...session, formation: Magistrat.Formation.SIEGE },
      excludedJurisdictions: new Set(['CA  RENNES']),
      pastReportCountPerGrade: new Map(),
      id: 'memberId',
    });

    const file = AutoAffectationNominationFile.from({
      session,
      id: 'nominationSessionFileId',
      targetJurisdiction: 'TGI RENNES',
      targetedGrade: Magistrat.Grade.II,
    });

    expect(member.canReportOn(file)).toBe(false);
  });

  it('should use the report contributions count to auto affect members to nomination files', () => {
    const members = [
      AutoAffectationMember.from({
        session,
        excludedJurisdictions: new Set(['CA  RENNES']),
        pastReportCountPerGrade: new Map([[Magistrat.Grade.I, 10]]),
        id: 'memberId',
      }),
      AutoAffectationMember.from({
        session,
        excludedJurisdictions: new Set(['CA  STRASBOURG']),
        pastReportCountPerGrade: new Map([[Magistrat.Grade.I, 5]]),
        id: 'memberId2',
      }),
      AutoAffectationMember.from({
        session,
        excludedJurisdictions: new Set(['CA  LYON']),
        pastReportCountPerGrade: new Map(),
        id: 'memberId3',
      }),
    ];

    const file = AutoAffectationNominationFile.from({
      session,
      id: 'nominationSessionFileId',
      targetJurisdiction: 'TGI  NANTES',
      targetedGrade: Magistrat.Grade.II,
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
        pastReportCountPerGrade: new Map(),
      }),
      AutoAffectationMember.from({
        session,
        id: 'memberId2',
        excludedJurisdictions: null,
        pastReportCountPerGrade: new Map(),
      }),
    ];

    // prettier-ignore
    const files: AutoAffectationNominationFile[] = [
      AutoAffectationNominationFile.from({ id: 'file-1', targetedGrade: Magistrat.Grade.HH, targetJurisdiction: 'CA  RENNES', session }),
      AutoAffectationNominationFile.from({ id: 'file-2', targetedGrade: Magistrat.Grade.II, targetJurisdiction: 'CA  RENNES', session }),
      AutoAffectationNominationFile.from({ id: 'file-3', targetedGrade: Magistrat.Grade.II, targetJurisdiction: 'CA  RENNES', session }),
      AutoAffectationNominationFile.from({ id: 'file-4', targetedGrade: Magistrat.Grade.HH, targetJurisdiction: 'CA  RENNES', session }),
      AutoAffectationNominationFile.from({ id: 'file-5', targetedGrade: Magistrat.Grade.I, targetJurisdiction: 'CA  RENNES', session }),
      AutoAffectationNominationFile.from({ id: 'file-6', targetedGrade: Magistrat.Grade.HH, targetJurisdiction: 'CA  RENNES', session }),
      AutoAffectationNominationFile.from({ id: 'file-7', targetedGrade: Magistrat.Grade.I, targetJurisdiction: 'CA  RENNES', session }),
    ];

    const autoAffectations = AutoAffectations.from({ members, files });
    const result = autoAffectations.distribute();

    // prettier-ignore
    {
      expect(result).toContainEqual({ nominationFileId: 'file-1', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-2', reporterIds: ['memberId2'] });

      expect(result).toContainEqual({ nominationFileId: 'file-3', reporterIds: ['memberId2'] });
      expect(result).toContainEqual({ nominationFileId: 'file-4', reporterIds: ['memberId2'] });

      expect(result).toContainEqual({ nominationFileId: 'file-5', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-6', reporterIds: ['memberId1'] });
      expect(result).toContainEqual({ nominationFileId: 'file-7', reporterIds: ['memberId2'] });
    }

    expect(members).toContainEqual(
      expect.objectContaining({ id: 'memberId1', workload: { value: 9 } }),
    );
    expect(members).toContainEqual(
      expect.objectContaining({ id: 'memberId2', workload: { value: 9 } }),
    );
  });
});
