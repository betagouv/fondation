import { Magistrat } from 'shared-models';

export type AutoAffectationNominationFile = {
  id: string;
  targetJurisdiction: string;
  formation: Magistrat.Formation;
};

export class AutoAffectations {
  private static sort(
    members: readonly AutoAffectationMember[],
  ): readonly AutoAffectationMember[] {
    return [...members].sort(
      AutoAffectationMember.compareByPastReportContributionsCountAsc,
    );
  }

  private constructor(
    private readonly nominationFiles: readonly AutoAffectationNominationFile[],
    private readonly members: readonly AutoAffectationMember[],
  ) {}

  static from(props: {
    files: readonly AutoAffectationNominationFile[];
    members: readonly AutoAffectationMember[];
  }): AutoAffectations {
    return new AutoAffectations(props.files, props.members);
  }

  /** @see https://www.notion.so/26aa2ff25f158049a016f768e7bbb86f */
  distribute(): { nominationFileId: string; reporterIds: readonly string[] }[] {
    return this.nominationFiles.map((nominationFile) => {
      const reporterIds = AutoAffectations.sort(this.members)
        .filter((member) => member.canReportOn(nominationFile))
        .slice(0, 1)
        .map((member) => member.affect().id);

      return {
        reporterIds,
        nominationFileId: nominationFile.id,
      };
    });
  }
}

export class AutoAffectationMember {
  private constructor(
    readonly id: string,
    readonly formation: Magistrat.Formation,
    readonly excludedJurisdictions: Set<string> | null,
    private pastReportContributionsCount: number,
  ) {}

  static from(props: {
    id: string;
    formation: Magistrat.Formation;
    pastReportContributionsCount: number;
    excludedJurisdictions: Set<string> | null;
  }): AutoAffectationMember {
    return new AutoAffectationMember(
      props.id,
      props.formation,
      props.excludedJurisdictions,
      props.pastReportContributionsCount,
    );
  }

  affect(): this {
    this.pastReportContributionsCount += 1;

    return this;
  }

  canReportOn(candidate: AutoAffectationNominationFile): boolean {
    return (
      candidate.formation === this.formation &&
      !this.excludedJurisdictions?.has(candidate.targetJurisdiction)
    );
  }

  static compareByPastReportContributionsCountAsc(
    a: AutoAffectationMember,
    b: AutoAffectationMember,
  ): number {
    return a.pastReportContributionsCount - b.pastReportContributionsCount;
  }
}
