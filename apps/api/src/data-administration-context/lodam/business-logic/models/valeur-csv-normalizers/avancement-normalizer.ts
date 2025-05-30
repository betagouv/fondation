import { z } from 'zod';
import { InvalidRowValueError } from '../../../../transparences/business-logic/errors/invalid-row-value.error';
import { Avancement } from '../avancement';

export class AvancementNormalizer {
  static normalize(avancement: string): Avancement {
    try {
      return z.nativeEnum(Avancement).parse(avancement);
    } catch {
      throw new InvalidRowValueError('avancement', avancement, 0);
    }
  }
}
