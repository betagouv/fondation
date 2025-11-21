import { Magistrat } from 'shared-models';

export type Candidate = {
  jurisdictionTarget: string;
  formation: Magistrat.Formation;
  nominationSessionFileId: string;
};

export class Affectations {
  private static sort(members: readonly Member[]): readonly Member[] {
    return [...members].sort(Member.compareByPastReportContributionsCountAsc);
  }

  constructor(
    private readonly candidates: Candidate[],
    private readonly members: Member[],
  ) {
    this.autoAffect();
  }

  autoAffect(): Map<Candidate, Member[]> {
    const affectations = this.candidates.reduce((affectation, candidate) => {
      const affectedMembers = Affectations.sort(this.members)
        .filter((member) => member.canReportOn(candidate))
        .slice(0, 1)
        .map((member) => member.affect(candidate));

      return affectation.set(candidate, affectedMembers);
    }, new Map<Candidate, Member[]>());

    this.publishAutoAffectation(affectations);
    return affectations;
  }

  private publishAutoAffectation(affectations: Map<Candidate, Member[]>) {
    affectations.forEach((members, candidate) => {
      this.pushMessage(
        new CandidateAffectationEvent({
          candidate,
          members,
        }),
      );
    });
  }

  readonly #messages: CandidateAffectationEvent[] = [];
  get messages(): CandidateAffectationEvent[] {
    return this.#messages;
  }

  private pushMessage(message: CandidateAffectationEvent) {
    this.#messages.push(message);
  }
}

export class CandidateAffectationEvent {
  readonly candidate: Candidate;
  readonly members: Member[];

  constructor(props: { candidate: Candidate; members: Member[] }) {
    this.candidate = props.candidate;
    this.members = props.members;
  }
}

// TODO : Rajouter une methode/propriété/assertion pour interdire plus d'un certains nombre
// d'affectations sur la session?
export class Member {
  readonly affectations: Candidate[] = [];

  constructor(
    readonly formation: Magistrat.Formation,
    readonly forbiddenJurisdiction: Set<string> | null,
    private pastReportContributionsCount: number = 0,
    readonly id: string,
  ) {}

  static from(props: {
    formation: Magistrat.Formation;
    forbiddenJurisdiction: Set<string> | null;
    pastReportContributionsCount: number;
    id: string;
  }): Member {
    const {
      formation,
      forbiddenJurisdiction,
      pastReportContributionsCount,
      id,
    } = props;
    return new Member(
      formation,
      forbiddenJurisdiction,
      pastReportContributionsCount,
      id,
    );
  }

  affect(candidate: Candidate): this {
    this.affectations.push(candidate);
    this.pastReportContributionsCount += 1;

    return this;
  }

  canReportOn(candidate: Candidate): boolean {
    return (
      candidate.formation === this.formation &&
      !this.forbiddenJurisdiction?.has(candidate.jurisdictionTarget)
    );
  }

  static compareByPastReportContributionsCountAsc(
    a: Member,
    b: Member,
  ): number {
    return a.pastReportContributionsCount - b.pastReportContributionsCount;
  }
}
