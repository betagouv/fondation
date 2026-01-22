import { Magistrat } from 'shared-models';

/**
 * @warning this is only used in the database to sort on the grade
 */
export function gradeEnumToSortableTargetedGrade(
  grade: Magistrat.Grade,
): number {
  switch (grade) {
    case Magistrat.Grade.G3SUP:
      return 35;
    case Magistrat.Grade.G3:
      return 30;
    case Magistrat.Grade.G2:
      return 20;
    case Magistrat.Grade.G1:
      return 10;

    case Magistrat.Grade.HH:
    case Magistrat.Grade.III:
      return 3;
    case Magistrat.Grade.I:
      return 2;
    case Magistrat.Grade.II:
      return 1;
    default:
      return 0;
  }
}
