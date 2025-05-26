import { Magistrat } from 'shared-models';
import { InvalidRowValueError } from '../../errors/invalid-row-value.error';

export class FormationTsvNormalizer {
  static normalize(formation: string, rowIndex: number): Magistrat.Formation {
    switch (formation) {
      case 'Parquet':
        return Magistrat.Formation.PARQUET;
      case 'Siège':
        return Magistrat.Formation.SIEGE;
      default:
        throw new InvalidRowValueError('formation', formation, rowIndex);
    }
  }
}
