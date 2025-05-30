import { Magistrat } from 'shared-models';
import { InvalidRowValueError } from '../../../../transparences/business-logic/errors/invalid-row-value.error';

export class GradeTsvNormalizer {
  static normalize(grade: string, rowIndex: number): Magistrat.Grade {
    switch (grade) {
      case 'I':
        return Magistrat.Grade.I;
      case 'II':
        return Magistrat.Grade.II;
      case 'HH':
        return Magistrat.Grade.HH;
      default:
        throw new InvalidRowValueError('grade', grade, rowIndex);
    }
  }
}
