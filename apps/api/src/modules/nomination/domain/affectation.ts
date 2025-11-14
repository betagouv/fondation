import { Magistrat } from 'shared-models';

export type Jurisdiction = { code: string };

export class Candidate {
  constructor(
    readonly formation: Magistrat.Formation,
    readonly jurisdiction: Jurisdiction,
  ) {}

  static from(props: {
    formation: Magistrat.Formation;
    jurisdiction: Jurisdiction;
  }): Candidate {
    const { formation, jurisdiction } = props;
    return new Candidate(formation, jurisdiction);
  }
}

export class MemberCollection {
  constructor(
    readonly members: Member[],
    readonly candidates: Candidate[],
  ) {
    this.refreshMembersOrder();
  }

  autoAffect(): void {
    for (const candidate of this.candidates) {
      let affectationsCount = 0;
      memberLoop: for (const member of this.members) {
        if (member.canReportOn(candidate)) {
          member.affect(candidate);

          affectationsCount++;
          if (affectationsCount == 2) {
            break memberLoop;
          }
        }
      }

      this.refreshMembersOrder();
    }
  }

  private refreshMembersOrder() {
    this.members.sort(Member.compareByChargeAsc);
  }
}

export class Member {
  static compareByChargeAsc(a: Member, b: Member): number {
    return a.pastReportContributionsCount - b.pastReportContributionsCount;
  }

  readonly affectations: Candidate[] = [];

  constructor(
    readonly formation: Magistrat.Formation,
    readonly jurisdiction: Jurisdiction | null,
    private pastReportContributionsCount: number = 0,
  ) {}

  static from(props: {
    formation: Magistrat.Formation;
    jurisdiction: Jurisdiction | null;
    pastReportContributionsCount: number;
  }): Member {
    const { formation, jurisdiction, pastReportContributionsCount } = props;
    return new Member(formation, jurisdiction, pastReportContributionsCount);
  }

  affect(candidate: Candidate) {
    this.affectations.push(candidate);
    this.pastReportContributionsCount += 1;
  }

  canReportOn(candidate: Candidate): boolean {
    if (candidate.formation !== this.formation) {
      return false;
    }

    if (!this.jurisdiction) {
      return true;
    }
    return this.jurisdiction.code !== candidate.jurisdiction.code;
  }
}

export class Affectation {}
