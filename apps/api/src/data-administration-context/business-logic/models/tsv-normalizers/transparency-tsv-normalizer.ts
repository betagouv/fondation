import { Transparency } from 'shared-models';
import { InvalidRowValueError } from '../../errors/invalid-row-value.error';

export const transparencyMap: { [key in Transparency]: string } = {
  [Transparency.AUTOMNE_2024]: 'Automne 2024',
  [Transparency.MARCH_2025]: 'Mars 2025',
  [Transparency.MARCH_2026]: 'Mars 2026',
  [Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024]: 'Transparence PG 08/11',
  [Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024]: 'Transparence PG 25/11',
  [Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024]:
    'Tableau général T du 25/11',
  [Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025]:
    'Transparence 21/01/25',
  [Transparency.SIEGE_DU_06_FEVRIER_2025]: 'Transparence S06/02/25',
  [Transparency.PARQUET_DU_06_FEVRIER_2025]: 'Transparence P06/02/25',
};

export class TransparencyTsvNormalizer {
  static normalize(transparency: string, rowIndex: number): Transparency {
    const transparencyEnum = Object.entries(transparencyMap).find(
      ([, value]) => {
        if (value === transparency) {
          return true;
        }
      },
    );

    if (!transparencyEnum)
      throw new InvalidRowValueError('transparency', transparency, rowIndex);

    return transparencyEnum[0] as Transparency;
  }
}
