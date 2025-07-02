import { z } from 'zod';

export class GdsTransparenciesRoutesMapper {
  static toPathSegment(nomTransparence: string): string {
    return encodeURIComponent(nomTransparence);
  }

  static toTransparency(pathSegment: string): string {
    return z.string().parse(decodeURIComponent(pathSegment));
  }
}
