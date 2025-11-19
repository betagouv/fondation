import { Magistrat } from 'shared-models';

export type Candidate = {
  jurisdiction: string;
  formation: Magistrat.Formation;
};

export class Affectations {
  autoAffect(props: {
    members: readonly Member[];
    candidates: readonly Candidate[];
  }): Map<Candidate, Member[]> {
    return props.candidates.reduce((affectation, candidate) => {
      const affectedMembers = Affectations.sort(props.members)
        .filter((member) => member.canReportOn(candidate))
        .slice(0, 2)
        .map((member) => member.affect(candidate));

      return affectation.set(candidate, affectedMembers);
    }, new Map<Candidate, Member[]>());
  }

  private static sort(members: readonly Member[]): readonly Member[] {
    return [...members].sort(Member.compareByPastReportContributionsCountAsc);
  }
}

export class Member {
  readonly affectations: Candidate[] = [];

  constructor(
    readonly formation: Magistrat.Formation,
    readonly jurisdictions: Set<string>,
    private pastReportContributionsCount: number = 0,
  ) {}

  static from(props: {
    formation: Magistrat.Formation;
    jurisdiction: Set<string>;
    pastReportContributionsCount: number;
  }): Member {
    const { formation, jurisdiction, pastReportContributionsCount } = props;
    return new Member(formation, jurisdiction, pastReportContributionsCount);
  }

  affect(candidate: Candidate): this {
    this.affectations.push(candidate);
    this.pastReportContributionsCount += 1;

    return this;
  }

  canReportOn(candidate: Candidate): boolean {
    return (
      candidate.formation === this.formation &&
      candidate.jurisdiction !== this.jurisdictions
    );
  }

  static compareByPastReportContributionsCountAsc(
    a: Member,
    b: Member,
  ): number {
    return a.pastReportContributionsCount - b.pastReportContributionsCount;
  }
}
