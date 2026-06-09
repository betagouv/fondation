import { type LolfiGradeEnum } from './types';

export function gradeToNumber(grade: LolfiGradeEnum): number {
  switch (grade) {
    case 'G3sup':
      return 29;
    case 'G3':
      return 30;
    case 'G2':
      return 31;
    case 'G1':
      return 32;
  }
}
