import { Magistrat } from 'shared-models';

/**
 * @warning this is only used in the database to sort on the grade
 */
export function gradeEnumToSortableTargetedGrade(grade: Magistrat.Grade): number {
  switch (grade) {
    case Magistrat.Grade.G3SUP:
      return 29;
    case Magistrat.Grade.G3:
      return 30;
    case Magistrat.Grade.G2:
      return 31;
    case Magistrat.Grade.G1:
      return 32;

    case Magistrat.Grade.HH:
    case Magistrat.Grade.III:
      return 10;
    case Magistrat.Grade.I:
      return 20;
    case Magistrat.Grade.II:
      return 30;
    default:
      return 0;
  }
}
