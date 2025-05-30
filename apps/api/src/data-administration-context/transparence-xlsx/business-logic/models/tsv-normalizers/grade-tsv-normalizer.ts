import { Magistrat } from 'shared-models';
import { InvalidRowValueError } from '../../../../transparences/business-logic/errors/invalid-row-value.error';

export class GradeTsvNormalizer {
  static normalize(
    posteCible: string,
    avancement: string,
    rowIndex: number,
  ): Magistrat.Grade {
    const gradeRegex = /\s[-–]\s*(I{1,2}|HH)\b/;

    const match = posteCible.match(gradeRegex);

    if (!match || !match[1]) {
      throw new Error(
        `Le poste cible "${posteCible}" ne contient pas de grade valide. Ligne ${rowIndex + 1}`,
      );
    }

    const gradeCible = match[1] as Magistrat.Grade;

    if (avancement === 'A') {
      switch (gradeCible) {
        case Magistrat.Grade.I:
          return Magistrat.Grade.II;
        case Magistrat.Grade.HH:
          return Magistrat.Grade.I;
        case Magistrat.Grade.II:
          throw new Error('Avancement vers un grade II pas possible');
        default:
          throw new InvalidRowValueError('grade', gradeCible!, rowIndex);
      }
    } else if (avancement === 'E') {
      switch (gradeCible) {
        case Magistrat.Grade.I:
          return Magistrat.Grade.I;
        case Magistrat.Grade.II:
          return Magistrat.Grade.II;
        case Magistrat.Grade.HH:
          return Magistrat.Grade.HH;
        default:
          throw new InvalidRowValueError('grade', gradeCible!, rowIndex);
      }
    }
    throw new InvalidRowValueError('grade', gradeCible!, rowIndex);
  }
}
