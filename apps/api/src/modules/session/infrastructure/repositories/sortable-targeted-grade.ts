import { GradeEnum } from 'src/modules/shared/grade.enum';

/**
 * @warning this is only used in the database to sort on the grade
 */
export function gradeEnumToSortableTargetedGrade(grade: GradeEnum): number {
  switch (grade) {
    case 'G3sup':
      return 29;
    case 'G3':
      return 30;
    case 'G2':
      return 31;
    case 'G1':
      return 32;

    case 'HH':
    case 'III':
      return 10;
    case 'I':
      return 20;
    case 'II':
      return 30;
    default:
      return 0;
  }
}
