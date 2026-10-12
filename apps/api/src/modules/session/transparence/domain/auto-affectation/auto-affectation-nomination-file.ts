import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { DateOnly } from 'src/utils/date-only';

import { AutoAffectationWorkload } from './auto-affectation-file-workload';

export class AutoAffectationNominationFile {
  constructor(
    readonly id: string,
    readonly number: number,
    readonly currentJurisdiction: string | null,
    readonly targetedJurisdiction: string | null,
    readonly formation: FormationEnum,
    readonly targetedGrade: GradeEnum,
    readonly workload: AutoAffectationWorkload,
  ) {}

  static from(props: {
    id: string;
    number: number;
    currentJurisdiction: string | null;
    targetedJurisdiction: string | null;
    targetedGrade: GradeEnum;
    session: { formation: FormationEnum; date: DateOnly };
  }): AutoAffectationNominationFile {
    return new AutoAffectationNominationFile(
      props.id,
      props.number,
      props.currentJurisdiction,
      props.targetedJurisdiction,
      props.session.formation,
      props.targetedGrade,
      AutoAffectationWorkload.from({
        sessionDate: props.session.date,
        grade: props.targetedGrade,
      }),
    );
  }

  static group(
    iterable: Iterable<AutoAffectationNominationFile>,
  ): IteratorObject<AutoAffectationNominationFile[]> {
    const map = new Map<GradeEnum, AutoAffectationNominationFile[]>();
    for (const file of iterable) {
      const key = file.targetedGrade === 'G3' || file.targetedGrade === 'G3sup' ? 'G3' : file.targetedGrade;

      const list = map.get(key);
      if (list) list.push(file);
      else map.set(key, [file]);
    }

    map.forEach((list) => list.sort((a, b) => a.number - b.number));

    return map.values();
  }
}
