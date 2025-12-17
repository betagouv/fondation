import { Logger } from '@nestjs/common';
import { Magistrat } from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { assertNever } from 'src/utils/assert-never';

export class AutoAffectations {
  private constructor(
    private readonly nominationFiles: readonly AutoAffectationNominationFile[],
    private readonly members: readonly AutoAffectationMember[],
  ) {}

  static from(props: {
    files: readonly AutoAffectationNominationFile[];
    members: readonly AutoAffectationMember[];
  }): AutoAffectations {
    return new AutoAffectations(
      [...props.files].sort(
        /* desc */ (a, b) => AutoAffectationNominationFile.sort(b, a),
      ),
      props.members,
    );
  }

  /** @see https://www.notion.so/26aa2ff25f158049a016f768e7bbb86f */
  distribute(): { nominationFileId: string; reporterIds: readonly string[] }[] {
    return this.nominationFiles.map((nominationFile) => {
      const reporterIds = AutoAffectations.sort(this.members)
        .filter((member) => member.canReportOn(nominationFile))
        .slice(0, 1)
        .map((member) => member.affect(nominationFile).id);

      return {
        reporterIds,
        nominationFileId: nominationFile.id,
      };
    });
  }

  private static sort(
    members: readonly AutoAffectationMember[],
  ): readonly AutoAffectationMember[] {
    return [...members].sort(AutoAffectationMember.compareByWorkloadAsc);
  }
}

export class AutoAffectationMember {
  private constructor(
    readonly id: string,
    readonly formation: Magistrat.Formation,
    readonly excludedJurisdictions: Set<string> | null,
    private workload: NominationFileWorkload,
  ) {}

  static from(props: {
    id: string;
    session: { date: DateOnly; formation: Magistrat.Formation };
    pastReportCountPerGrade: Map<Magistrat.Grade, number>;
    excludedJurisdictions: Set<string> | null;
  }): AutoAffectationMember {
    const pastWorkload = Array.from(
      props.pastReportCountPerGrade.entries(),
    ).reduce(
      (workload, [grade, count]) =>
        workload.add(
          NominationFileWorkload.fromMultiple({
            sessionDate: props.session.date,
            count,
            grade,
          }),
        ),
      NominationFileWorkload.zero(),
    );

    return new AutoAffectationMember(
      props.id,
      props.session.formation,
      props.excludedJurisdictions,
      pastWorkload,
    );
  }

  affect(file: AutoAffectationNominationFile): this {
    this.workload = this.workload.add(file.workload);

    return this;
  }

  canReportOn(candidate: AutoAffectationNominationFile): boolean {
    return (
      candidate.formation === this.formation &&
      !this.excludedJurisdictions?.has(candidate.targetJurisdiction)
    );
  }

  static compareByWorkloadAsc(
    a: AutoAffectationMember,
    b: AutoAffectationMember,
  ): number {
    return a.workload.toNumber() - b.workload.toNumber();
  }
}

class NominationFileWorkload {
  private constructor(private readonly value: number) {}

  toNumber(): number {
    return this.value;
  }

  add({ value }: NominationFileWorkload): NominationFileWorkload {
    return new NominationFileWorkload(this.value + value);
  }

  static zero(): NominationFileWorkload {
    return new NominationFileWorkload(0);
  }

  static fromMultiple(props: {
    sessionDate: DateOnly;
    grade: Magistrat.Grade;
    count: number;
  }): NominationFileWorkload {
    return new NominationFileWorkload(this.from(props).value * props.count);
  }

  static from(props: {
    sessionDate: DateOnly;
    grade: Magistrat.Grade;
  }): NominationFileWorkload {
    return new NominationFileWorkload(this.compute(props));
  }

  private static compute(file: {
    sessionDate: DateOnly;
    grade: Magistrat.Grade;
  }): number {
    if (this.isDeprecatedGrading(file)) {
      return this.getDeprecatedGrading(file);
    }

    switch (file.grade) {
      case Magistrat.Grade.I:
        return 1;
      case Magistrat.Grade.II:
        return 2;
      case Magistrat.Grade.III:
        return 3;
      case Magistrat.Grade.HH:
        return 4;
      default:
        return assertNever(file.grade);
    }
  }

  private static isDeprecatedGrading(file: { sessionDate: DateOnly }): boolean {
    return file.sessionDate.toDate().getTime() < Date.UTC(2025, 11, 1);
  }

  private static getDeprecatedGrading(file: {
    grade: Magistrat.Grade;
  }): number {
    switch (file.grade) {
      case Magistrat.Grade.II:
        return 1;
      case Magistrat.Grade.I:
        return 2;
      case Magistrat.Grade.HH:
        return 3;

      case Magistrat.Grade.III: {
        new Logger(AutoAffectations.name).warn(
          `Received grade ${file.grade} for nomination session older than 2025-12-01`,
        );
        return 2;
      }
      default:
        return assertNever(file.grade);
    }
  }
}

export class AutoAffectationNominationFile {
  readonly workload: NominationFileWorkload;

  constructor(
    readonly id: string,
    readonly targetJurisdiction: string,
    readonly formation: Magistrat.Formation,
    readonly targetedGrade: Magistrat.Grade,
    sessionDate: DateOnly,
  ) {
    this.workload = NominationFileWorkload.from({
      sessionDate,
      grade: targetedGrade,
    });
  }

  static from(props: {
    id: string;
    targetJurisdiction: string;
    targetedGrade: Magistrat.Grade;
    session: { formation: Magistrat.Formation; date: DateOnly };
  }): AutoAffectationNominationFile {
    return new AutoAffectationNominationFile(
      props.id,
      props.targetJurisdiction,
      props.session.formation,
      props.targetedGrade,
      props.session.date,
    );
  }

  static sort(
    fileA: AutoAffectationNominationFile,
    fileB: AutoAffectationNominationFile,
  ): number {
    return fileA.workload.toNumber() - fileB.workload.toNumber();
  }
}
