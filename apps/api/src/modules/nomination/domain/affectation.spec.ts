import { Magistrat } from 'shared-models';
import { Candidate, Member, MemberCollection } from './affectation';

describe('automated affectation', () => {
  it('should exclude a candidate, when the target is of the same jurisdiction', () => {
    const member = Member.from({
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: { code: 'CA  RENNES' },
      pastReportContributionsCount: 0,
    });
    const candidate = Candidate.from({
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: { code: 'CA  RENNES' },
    });

    expect(member.canReportOn(candidate)).toBe(false);
  });

  it('should allow a candidate, when the juridiscition is not defined', () => {
    const member = Member.from({
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: null,
      pastReportContributionsCount: 0,
    });

    const candidate = Candidate.from({
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: { code: 'CA RENNES' },
    });

    expect(member.canReportOn(candidate)).toBe(true);
  });

  it('should allow a candidate, when the target is NOT of the same jurisdiction', () => {
    const member = Member.from({
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: { code: 'CA  RENNES' },
      pastReportContributionsCount: 0,
    });

    const candidate = Candidate.from({
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: { code: 'TGI RENNES' },
    });

    expect(member.canReportOn(candidate)).toBe(true);
  });

  it('should exclude a candidate, when the formation is not the same', () => {
    const member = Member.from({
      formation: Magistrat.Formation.SIEGE,
      jurisdiction: { code: 'CA  RENNES' },
      pastReportContributionsCount: 0,
    });
    const candidate = Candidate.from({
      formation: Magistrat.Formation.PARQUET,
      jurisdiction: { code: 'TGI RENNES' },
    });

    expect(member.canReportOn(candidate)).toBe(false);
  });

  it('should use the report contributions count to auto affect members to candidates', () => {
    const members = [
      Member.from({
        formation: Magistrat.Formation.PARQUET,
        jurisdiction: { code: 'CA  RENNES' },
        pastReportContributionsCount: 10,
      }),
      Member.from({
        formation: Magistrat.Formation.PARQUET,
        jurisdiction: { code: 'CA  STRASBOURG' },
        pastReportContributionsCount: 5,
      }),
      Member.from({
        formation: Magistrat.Formation.PARQUET,
        jurisdiction: { code: 'CA  LYON' },
        pastReportContributionsCount: 0,
      }),
    ];

    const membersCollection = new MemberCollection(
      [...members],
      [
        Candidate.from({
          formation: Magistrat.Formation.PARQUET,
          jurisdiction: { code: 'TGI  NANTES' },
        }),
      ],
    );

    membersCollection.autoAffect();

    expect(members[0]?.affectations).toHaveLength(0);
    expect(members[1]?.affectations).toHaveLength(1);
    expect(members[2]?.affectations).toHaveLength(1);
  });
});
