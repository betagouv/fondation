import { Logger } from '@nestjs/common';
import { Magistrat } from 'shared-models';
import { assertNever } from 'src/utils/assert-never';
import { DateOnly } from 'src/utils/date-only';

export class AutoAffectations {
  private readonly logger = new Logger(AutoAffectations.name);

  private constructor(
    private readonly members: readonly AutoAffectationMember[],
    private readonly nominationFiles: IteratorObject<
      readonly AutoAffectationNominationFile[]
    >,
  ) {
    if (process.env.NODE_ENV === 'test' || process.env.CI) {
      this.logger.localInstance.setLogLevels?.([]);
    }
  }

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
    this.logger.debug(
      `Got ${this.members.length} members in formation ${this.members[0]!.formation}`,
    );

    for (const gradedFiles of this.nominationFiles) {
      // We only keep files where at least one member can report on
      const files = gradedFiles.filter((file) =>
        this.members.some((member) => member.canReportOn(file)),
      );

      this.logger.debug('');
      this.logger.debug(
        `${files.length} files available in grade ${gradedFiles[0]?.targetedGrade}`,
      );

      if (files.length !== gradedFiles.length) {
        this.logger.warn(`Excluded ${gradedFiles.length - files.length} files`);
      }

      const sortedMembers = this.members.toSorted(
        AutoAffectationMember.fromMostToLeastWorkload,
      );

      /** If there are more members than files, we want to affect more files to the least
       work loaded member (end of the {@link sortedMembers} list). */
      const startMemberIndex = Math.max(0, this.members.length - files.length);

      {
        let sumTake = 0;
        let i = startMemberIndex;

        for (const member of sortedMembers) member.resetTake();

        while (sumTake < files.length) {
          const member = sortedMembers[i];
          if (member) {
            member.increaseTake();
            sumTake++;
          }

          i = (i + 1) % sortedMembers.length;
        }
      }

      for (
        let i = startMemberIndex, attempts = 0;
        i < sortedMembers.length && files.length > 0 && attempts < 2;
        i = (i + 1) % sortedMembers.length || attempts++
      ) {
        const member = sortedMembers[i];
        if (!member) continue;

        const filesChunk = files.splice(0, member.take);
        this.logger.debug(`Will affect ${member.take} files to the member`);

        if (filesChunk.some((file) => !member.canReportOn(file))) {
          this.logger.warn(`Jurisdiction exclusion on this files chunk`);

          if (i === startMemberIndex) {
            files.unshift(...filesChunk);
            const nextMember = sortedMembers
              .slice(i + 1, sortedMembers.length)
              .find((otherMember) =>
                filesChunk.every((file) => otherMember.canReportOn(file)),
              );

            if (nextMember) {
              this.logger.debug(`found another member, restarting...`);
              sortedMembers[i + 1] = member;
              sortedMembers[i] = nextMember;
              i -= 1;
            }
          } else {
            const found = sortedMembers
              .slice(startMemberIndex, i)
              .reverse()
              .concat(sortedMembers.slice(i + 1, sortedMembers.length))
              .find((otherMember) =>
                otherMember.exchangeLastAffectationWith(member, filesChunk),
              );

            if (found) {
              this.logger.debug(`exchanged files with another member`);
            } else {
              files.unshift(...filesChunk);
              this.logger.warn(`did not find another member to exchange files`);
            }
          }

          continue;
        }

        member.affect(...filesChunk);
      }
    }

    const result = this.members.flatMap((member) => member.affectations);
    this.logger.debug(`${result.length} affectations made`);

    return result;
  }
}

export class AutoAffectationMember {
  private readonly files: AutoAffectationNominationFile[][] = [];
  private workload: NominationFileWorkload = NominationFileWorkload.zero();
  #take: number = 0;

  private constructor(
    readonly id: string,
    readonly formation: Magistrat.Formation,
    readonly excludedJurisdictions: Set<string> | null,
    private readonly pastWorkload: NominationFileWorkload,
  ) {}

  get take(): number {
    return this.#take;
  }

  increaseTake(): number {
    return this.#take++;
  }

  resetTake() {
    this.#take = 0;
  }

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
    this.files.push(files);

    /**
     * NOTE: At the moment, adding load has no effect during the affectation process.
     * The affectation is made mainly inside a session, since ALL members are expected
     * to have at least one affectation, even with a huge workload.
     */
    for (const file of files) {
      this.workload = this.workload.add(file.workload);
    }

    return this;
  }

  exchangeLastAffectationWith(
    otherMember: AutoAffectationMember,
    files: AutoAffectationNominationFile[],
  ): boolean {
    if (files.some((file) => !this.canReportOn(file))) return false;

    const lastFiles = this.files.pop();
    if (!lastFiles || lastFiles.length === 0) return false;
    if (lastFiles.some((file) => !otherMember.canReportOn(file))) {
      this.files.push(lastFiles);
      return false;
    }

    otherMember.affect(...lastFiles);

    for (const file of lastFiles) {
      this.workload = this.workload.sub(file.workload);
    }

    this.affect(...files);

    return true;
  }

  get affectations(): {
    nominationFileId: string;
    reporterIds: string[];
  }[] {
    return this.files.flatMap((files) =>
      files.map((file) => ({
        reporterIds: [this.id],
        nominationFileId: file.id,
      })),
    );
  }

  canReportOn(candidate: AutoAffectationNominationFile): boolean {
    return (
      candidate.formation === this.formation &&
      !this.excludedJurisdictions?.has(candidate.targetedJurisdiction!) &&
      !this.excludedJurisdictions?.has(candidate.currentJurisdiction!)
    );
  }

  static fromMostToLeastWorkload(
    a: AutoAffectationMember,
    b: AutoAffectationMember,
  ): number {
    return b.pastWorkload.toNumber() - a.pastWorkload.toNumber();
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

  sub({ value }: NominationFileWorkload): NominationFileWorkload {
    return new NominationFileWorkload(this.value - value);
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
    const logger = new Logger(AutoAffectations.name);
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
        logger.warn(
          `Received grade ${file.grade} for nomination session newer than 2025-12-01`,
        );
        return 2;
      }

      case Magistrat.Grade.II: {
        logger.warn(
          `Received grade ${file.grade} for nomination session newer than 2025-12-01`,
        );
        return 1;
      }

      case Magistrat.Grade.III:
      case Magistrat.Grade.HH: {
        logger.warn(
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
    const logger = new Logger(AutoAffectations.name);
    switch (file.grade) {
      case Magistrat.Grade.II:
        return 1;
      case Magistrat.Grade.I:
        return 2;
      case Magistrat.Grade.HH:
        return 3;

      case Magistrat.Grade.G1: {
        logger.warn(
          `Received grade ${file.grade} for nomination session older than 2025-12-01`,
        );
        return 1;
      }
      case Magistrat.Grade.G2: {
        logger.warn(
          `Received grade ${file.grade} for nomination session older than 2025-12-01`,
        );
        return 2;
      }
      case Magistrat.Grade.G3:
      case Magistrat.Grade.G3SUP:
      case Magistrat.Grade.III: {
        logger.warn(
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
