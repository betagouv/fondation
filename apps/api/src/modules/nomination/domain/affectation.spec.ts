import { Magistrat } from 'shared-models';
import { Affectations, Candidate, Member } from './affectation';

describe('automated affectation', () => {
  it('should exclude a candidate, when targeting the same jurisdiction as the member', () => {
    const member = Member.from({
      formation: Magistrat.Formation.PARQUET,
      forbiddenJurisdiction: new Set(['CA  RENNES']),
      pastReportContributionsCount: 0,
      id: 'memberId',
    });
    const candidate: Candidate = {
      nominationSessionFileId: 'nominationSessionFileId',
      formation: Magistrat.Formation.PARQUET,
      jurisdictionTarget: 'CA  RENNES',
    };

    expect(member.canReportOn(candidate)).toBe(false);
  });

  it('should allow a candidate, when the jurisdiction is not defined', () => {
    const member = Member.from({
      formation: Magistrat.Formation.PARQUET,
      forbiddenJurisdiction: null,
      pastReportContributionsCount: 0,
      id: 'memberId',
    });

    const candidate: Candidate = {
      nominationSessionFileId: 'nominationSessionFileId',
      formation: Magistrat.Formation.PARQUET,
      jurisdictionTarget: 'CA RENNES',
    };

    expect(member.canReportOn(candidate)).toBe(true);
  });

  it('should allow a candidate, when targeting a different jurisdiction than the member', () => {
    const member = Member.from({
      formation: Magistrat.Formation.PARQUET,
      forbiddenJurisdiction: new Set(['CA  RENNES']),
      pastReportContributionsCount: 0,
      id: 'memberId',
    });

    const candidate: Candidate = {
      nominationSessionFileId: 'nominationSessionFileId',
      formation: Magistrat.Formation.PARQUET,
      jurisdictionTarget: 'TGI RENNES',
    };

    expect(member.canReportOn(candidate)).toBe(true);
  });

  it('should exclude a candidate from a different formation than the member', () => {
    const member = Member.from({
      formation: Magistrat.Formation.SIEGE,
      forbiddenJurisdiction: new Set(['CA  RENNES']),
      pastReportContributionsCount: 0,
      id: 'memberId',
    });
    const candidate: Candidate = {
      nominationSessionFileId: 'nominationSessionFileId',
      formation: Magistrat.Formation.PARQUET,
      jurisdictionTarget: 'TGI RENNES',
    };
    expect(member.canReportOn(candidate)).toBe(false);
  });

  it('should use the report contributions count to auto affect members to candidates', () => {
    const members = [
      Member.from({
        formation: Magistrat.Formation.PARQUET,
        forbiddenJurisdiction: new Set(['CA  RENNES']),
        pastReportContributionsCount: 10,
        id: 'memberId',
      }),
      Member.from({
        formation: Magistrat.Formation.PARQUET,
        forbiddenJurisdiction: new Set(['CA  STRASBOURG']),
        pastReportContributionsCount: 5,
        id: 'memberId2',
      }),
      Member.from({
        formation: Magistrat.Formation.PARQUET,
        forbiddenJurisdiction: new Set(['CA  LYON']),
        pastReportContributionsCount: 0,
        id: 'memberId3',
      }),
    ];

    const candidate: Candidate = {
      nominationSessionFileId: 'nominationSessionFileId',
      formation: Magistrat.Formation.PARQUET,
      jurisdictionTarget: 'TGI  NANTES',
    };

    const result = new Affectations([candidate], [...members]).autoAffect();

    expect(result.get(candidate)).toEqual([
      expect.objectContaining({
        forbiddenJurisdiction: new Set(['CA  LYON']),
        pastReportContributionsCount: 1,
      }),
    ]);
  });
});
