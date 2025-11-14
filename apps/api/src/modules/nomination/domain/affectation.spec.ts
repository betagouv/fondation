import { Magistrat } from 'shared-models';
import { Affectations, Candidate, Member } from './affectation';

describe('automated affectation', () => {
  it('should exclude a candidate, when targeting the same jurisdiction as the member', () => {
    const member = Member.from({
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: 'CA  RENNES',
      pastReportContributionsCount: 0,
    });
    const candidate: Candidate = {
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: 'CA  RENNES',
    };

    expect(member.canReportOn(candidate)).toBe(false);
  });

  it('should allow a candidate, when the jurisdiction is not defined', () => {
    const member = Member.from({
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: null,
      pastReportContributionsCount: 0,
    });

    const candidate: Candidate = {
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: 'CA RENNES',
    };

    expect(member.canReportOn(candidate)).toBe(true);
  });

  it('should allow a candidate, when targeting a different jurisdiction than the member', () => {
    const member = Member.from({
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: 'CA  RENNES',
      pastReportContributionsCount: 0,
    });

    const candidate: Candidate = {
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: 'TGI RENNES',
    };

    expect(member.canReportOn(candidate)).toBe(true);
  });

  it('should exclude a candidate from a different formation than the member', () => {
    const member = Member.from({
      formation: Magistrat.Formation.SIEGE,
      jurisdiction: 'CA  RENNES',
      pastReportContributionsCount: 0,
    });
    const candidate: Candidate = {
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: 'TGI RENNES',
    };
    expect(member.canReportOn(candidate)).toBe(false);
  });

  it('should use the report contributions count to auto affect members to candidates', () => {
    const members = [
      Member.from({
        formation: Magistrat.Formation.PARQUET,
        jurisdiction: 'CA  RENNES',
        pastReportContributionsCount: 10,
      }),
      Member.from({
        formation: Magistrat.Formation.PARQUET,
        jurisdiction: 'CA  STRASBOURG',
        pastReportContributionsCount: 5,
      }),
      Member.from({
        formation: Magistrat.Formation.PARQUET,
        jurisdiction: 'CA  LYON',
        pastReportContributionsCount: 0,
      }),
    ];

    const candidate: Candidate = {
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: 'TGI  NANTES',
    };

    const result = new Affectations().autoAffect({
      members: [...members],
      candidates: [candidate],
    });

    expect(result.get(candidate)).toEqual([
      expect.objectContaining({ jurisdiction: 'CA  LYON' }),
      expect.objectContaining({ jurisdiction: 'CA  STRASBOURG' }),
    ]);
  });
});
