import type { DateOnlyJson } from 'shared-models';
import { z } from 'zod';
import { DateOnly } from '../models/date-only.model';

export class DateTransparenceRoutesMapper {
  static toPathSegment(dateTransparence: DateOnlyJson): string {
    return encodeURIComponent(
      DateOnly.fromStoreModel(dateTransparence).toFormattedString('dd-MM-yyyy')
    );
  }

  static toDateTransparence(pathSegment: string): DateOnlyJson {
    const dateString = decodeURIComponent(pathSegment);
    const [day, month, year] = dateString
      .split('-')
      .map((n) => z.coerce.number().parse(n));

    return DateOnly.ZOD_JSON_SCHEMA.parse({
      year,
      month,
      day
    });
  }
}
