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
      default:
        throw new InvalidRowValueError('transparency', transparency, rowIndex);
    }
  }
}
