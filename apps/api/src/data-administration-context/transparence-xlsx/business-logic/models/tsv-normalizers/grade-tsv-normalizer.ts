import { Magistrat } from 'shared-models';
import { InvalidRowValueError } from '../../../../transparences/business-logic/errors/invalid-row-value.error';

export class GradeTsvNormalizer {
  static normalize(
    posteCible: string,
    avancement: string,
    rowIndex: number,
  ): Magistrat.Grade {
    const [, gradeCible] = posteCible.split(/[-–]/).map((s) => s.trim());
    if (avancement === 'A') {
      switch (gradeCible) {
        case 'I':
          return Magistrat.Grade.II;
        case 'HH':
          return Magistrat.Grade.I;
        case 'II':
          throw new Error('Avancement vers un grade II pas possible');
        default:
          throw new InvalidRowValueError('grade', gradeCible!, rowIndex);
      }
    } else if (avancement === 'E') {
      switch (gradeCible) {
        case 'I':
          return Magistrat.Grade.I;
        case 'II':
          return Magistrat.Grade.II;
        case 'HH':
          return Magistrat.Grade.HH;
        default:
          throw new InvalidRowValueError('grade', gradeCible!, rowIndex);
      }
    }
    throw new InvalidRowValueError('grade', gradeCible!, rowIndex);
  }
}
