import { Transparency } from 'shared-models';
import { InvalidRowValueError } from '../../errors/invalid-row-value.error';

export class TransparencyTsvNormalizer {
  static normalize(transparency: string, rowIndex: number): Transparency {
    switch (transparency) {
      case 'Automne 2024':
        return Transparency.AUTOMNE_2024;
      case 'Mars 2025':
        return Transparency.MARCH_2025;
      case 'Mars 2026':
        return Transparency.MARCH_2026;
      case 'Transparence PG 08/11':
        return Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024;
      case 'Transparence PG 25/11':
        return Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024;
      case 'Tableau général T du 25/11':
        return Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024;
      case 'Transparence 21/01/25':
        return Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025;
      default:
        throw new InvalidRowValueError('transparency', transparency, rowIndex);
    }
  }
}
