import { Magistrat } from 'shared-models';

export class GradeTsvNormalizer {
  static normalize(grade: string): Magistrat.Grade {
    switch (grade) {
      case 'I':
        return Magistrat.Grade.I;
      case 'II':
        return Magistrat.Grade.II;
      case 'HH':
        return Magistrat.Grade.HH;
      default:
        throw new Error('Invalid grade: ' + grade);
    }
  }
}
