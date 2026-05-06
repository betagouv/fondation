import { Logger } from '@nestjs/common';

import { Magistrat } from 'shared-models';

import { DateOnly } from 'src/utils/date-only';

import { AutoAffectationWorkload } from './auto-affectation-file-workload';
import { AutoAffectationNominationFile } from './auto-affectation-nomination-file';

export class AutoAffectationMember {
  private constructor(
    readonly id: string,
    readonly formation: Magistrat.Formation,
    readonly excludedJurisdictions: Set<string> | null,
    private readonly pastWorkload: AutoAffectationWorkload,
  ) {}

  prepare(take: number) {
    let _take = take;
    return {
      get take() {
        return _take;
      },

      increaseTake() {
        _take += 1;
      },

      build: () => new AffectableMember(_take, this.id, this.formation, this.excludedJurisdictions),
    };
  }

  static from(props: {
    id: string;
    session: { date: DateOnly; formation: Magistrat.Formation };
    affectationCountPerGrade: Map<Magistrat.Grade, number>;
    excludedJurisdictions: Set<string> | null;
  }): AutoAffectationMember {
    const pastWorkload = Array.from(props.affectationCountPerGrade.entries()).reduce(
      (workload, [grade, count]) =>
        workload.add(
          AutoAffectationWorkload.fromMultiple({
            sessionDate: props.session.date,
            count,
            grade,
          }),
        ),
      AutoAffectationWorkload.zero(),
    );

    return new AutoAffectationMember(
      props.id,
      props.session.formation,
      props.excludedJurisdictions,
      pastWorkload,
    );
  }

  static fromLeastToMostWorkload(this: void, a: AutoAffectationMember, b: AutoAffectationMember): number {
    return a.pastWorkload.toNumber() - b.pastWorkload.toNumber();
  }
}

export class AffectableMember {
  private readonly logger: Logger;
  private readonly files: AutoAffectationNominationFile[][] = [];

  constructor(
    readonly take: number,
    private readonly id: string,
    private readonly formation: Magistrat.Formation,
    private readonly excludedJurisdictions: Set<string> | null,
  ) {
    this.logger = new Logger(`${AffectableMember.name}#${id}`);

    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'test' || process.env.CI) {
      this.logger.localInstance.setLogLevels?.([]);
    }
  }

  exchangeLastAffectationWith(
    otherMember: AffectableMember,
    files: AutoAffectationNominationFile[],
  ): boolean {
    if (files.some((file) => !this.canReportOn(file))) return false;

    const lastFiles = this.files.pop();
    if (!lastFiles || lastFiles.length === 0) return false;
    if (lastFiles.some((file) => !otherMember.canReportOn(file))) {
      this.files.push(lastFiles);
      return false;
    }

    this.logger.debug(`Un-Affecting ${lastFiles.length}`);

    otherMember.affect(lastFiles);
    this.affect(files);

    return true;
  }

  canReportOn(candidate: AutoAffectationNominationFile | AutoAffectationNominationFile[]): boolean {
    if (Array.isArray(candidate)) {
      return candidate.every((c) => this.canReportOn(c));
    }

    return (
      candidate.formation === this.formation &&
      !this.excludedJurisdictions?.has(candidate.targetedJurisdiction!) &&
      !this.excludedJurisdictions?.has(candidate.currentJurisdiction!)
    );
  }

  affect(files: AutoAffectationNominationFile[]): void {
    this.logger.debug(`Affecting ${files.length} files`);

    this.files.push(files);
  }

  get affectations(): { nominationFileId: string; reporterIds: string[] }[] {
    return this.files.flatMap((chunk) =>
      chunk.map((f) => ({ nominationFileId: f.id, reporterIds: [this.id] })),
    );
  }
}
