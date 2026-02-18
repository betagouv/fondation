import { Logger } from '@nestjs/common';
import { Magistrat } from 'shared-models';
import { assertNever } from 'src/utils/assert-never';
import { DateOnly } from 'src/utils/date-only';

export class AutoAffectations {
  private constructor(
    private readonly members: readonly AutoAffectationMember[],
    private readonly nominationFiles: IteratorObject<
      readonly AutoAffectationNominationFile[]
    >,
  ) {}

  static from(props: {
    files: readonly AutoAffectationNominationFile[];
    members: readonly AutoAffectationMember[];
  }): AutoAffectations {
    return new AutoAffectations(
      props.members,
      AutoAffectationNominationFile.group(props.files),
    );
  }

  /** @see https://www.notion.so/26aa2ff25f158049a016f768e7bbb86f */
  distribute(): {
    nominationFileId: string;
    reporterIds: readonly string[];
  }[] {
    const sortedMembers = this.members.toSorted(
      AutoAffectationMember.compareByWorkloadAsc,
    );

    const output: { nominationFileId: string; reporterIds: string[] }[] = [];
    for (const gradedFiles of this.nominationFiles) {
      const take = Math.ceil(gradedFiles.length / sortedMembers.length);

      let attempts = 0;
      const localGradedFiles = [...gradedFiles];

      while (localGradedFiles.length && attempts++ < 3) {
        for (
          let i = 0;
          i < sortedMembers.length && localGradedFiles.length > 0;
          i++
        ) {
          const member = sortedMembers[i];
          if (!member) continue;

          const files =
            i === sortedMembers.length - 1
              ? localGradedFiles.splice(0, localGradedFiles.length) // in the last iteration we take all remaining files
              : localGradedFiles.splice(0, take);

          if (files.some((file) => !member.canReportOn(file))) {
            localGradedFiles.unshift(...files);
            continue;
          }

          member.affect(...files);
          output.push(
            ...files.map(({ id: nominationFileId }) => ({
              reporterIds: [member.id],
              nominationFileId,
            })),
          );
        }
      }
    }

    return output;
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
    affectationCountPerGrade: Map<Magistrat.Grade, number>;
    excludedJurisdictions: Set<string> | null;
  }): AutoAffectationMember {
    const pastWorkload = Array.from(
      props.affectationCountPerGrade.entries(),
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

  affect(...files: AutoAffectationNominationFile[]): this {
    /**
     * NOTE: At the moment, adding load has no effect during the affectation process.
     * The affectation is made mainly inside a session, since ALL members are expected
     * to have at least one affectation, even with a huge workload.
     *
     * This method might disappear in the future, but is still used in tests.
     */
    for (const file of files) {
      this.workload = this.workload.add(file.workload);
    }

    return this;
  }

  canReportOn(candidate: AutoAffectationNominationFile): boolean {
    return (
      candidate.formation === this.formation &&
      !this.excludedJurisdictions?.has(candidate.targetedJurisdiction!) &&
      !this.excludedJurisdictions?.has(candidate.currentJurisdiction!)
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
      case Magistrat.Grade.G1:
        return 1;
      case Magistrat.Grade.G2:
        return 2;

      case Magistrat.Grade.G3:
      case Magistrat.Grade.G3SUP:
        return 3;

      case Magistrat.Grade.I: {
        new Logger(AutoAffectations.name).warn(
          `Received grade ${file.grade} for nomination session newer than 2025-12-01`,
        );
        return 2;
      }

      case Magistrat.Grade.II: {
        new Logger(AutoAffectations.name).warn(
          `Received grade ${file.grade} for nomination session newer than 2025-12-01`,
        );
        return 1;
      }

      case Magistrat.Grade.III:
      case Magistrat.Grade.HH: {
        new Logger(AutoAffectations.name).warn(
          `Received grade ${file.grade} for nomination session newer than 2025-12-01`,
        );
        return 3;
      }

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

      case Magistrat.Grade.G1: {
        new Logger(AutoAffectations.name).warn(
          `Received grade ${file.grade} for nomination session older than 2025-12-01`,
        );
        return 1;
      }
      case Magistrat.Grade.G2: {
        new Logger(AutoAffectations.name).warn(
          `Received grade ${file.grade} for nomination session older than 2025-12-01`,
        );
        return 2;
      }
      case Magistrat.Grade.G3:
      case Magistrat.Grade.G3SUP:
      case Magistrat.Grade.III: {
        new Logger(AutoAffectations.name).warn(
          `Received grade ${file.grade} for nomination session older than 2025-12-01`,
        );
        return 3;
      }
      default:
        return assertNever(file.grade);
    }
  }
}

export class AutoAffectationNominationFile {
  constructor(
    readonly id: string,
    readonly number: number,
    readonly currentJurisdiction: string | null,
    readonly targetedJurisdiction: string | null,
    readonly formation: Magistrat.Formation,
    readonly targetedGrade: Magistrat.Grade,
    readonly workload: NominationFileWorkload,
  ) {}

  static from(props: {
    id: string;
    number: number;
    currentJurisdiction: string | null;
    targetedJurisdiction: string | null;
    targetedGrade: Magistrat.Grade;
    session: { formation: Magistrat.Formation; date: DateOnly };
  }): AutoAffectationNominationFile {
    return new AutoAffectationNominationFile(
      props.id,
      props.number,
      props.currentJurisdiction,
      props.targetedJurisdiction,
      props.session.formation,
      props.targetedGrade,
      NominationFileWorkload.from({
        sessionDate: props.session.date,
        grade: props.targetedGrade,
      }),
    );
  }

  static group(
    iterable: Iterable<AutoAffectationNominationFile>,
  ): IteratorObject<AutoAffectationNominationFile[]> {
    const map = new Map<Magistrat.Grade, AutoAffectationNominationFile[]>();
    for (const file of iterable) {
      const key =
        file.targetedGrade === Magistrat.Grade.G3 ||
        file.targetedGrade === Magistrat.Grade.G3SUP
          ? Magistrat.Grade.G3
          : file.targetedGrade;

      const list = map.get(key);
      if (list) list.push(file);
      else map.set(key, [file]);
    }

    map.forEach((list) => list.sort((a, b) => a.number - b.number));

    return map.values();
  }
}
