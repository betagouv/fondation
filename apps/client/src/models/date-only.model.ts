import { format, isValid, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { z } from 'zod';

import type { DateOnlyJson } from 'shared-models';

const dateOnlyJsonSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12),
  day: z.number().min(1).max(31),
});

function validDate<T, U>(
  message: string,
  mapper: (value: T) => U,
): (value: T, ctx: z.core.ParsePayload) => U {
  return (input: T, ctx) => {
    try {
      return mapper(input);
    } catch {
      ctx.issues.push({ code: 'custom', input, message });
      return z.NEVER;
    }
  };
}

function assertIsValidDate(date: Date, message?: string): Date {
  if (!isValid(date)) throw new Error(message ?? `Invalid date`);
  return date;
}

export class DateOnly {
  static ZOD_JSON_SCHEMA = dateOnlyJsonSchema;

  static codec(message?: string) {
    return z.codec(z.iso.date('Date invalide'), dateOnlyJsonSchema, {
      decode: validDate(message || 'Date invalide', (value) =>
        DateOnly.fromString(value, 'yyyy-MM-dd').toStoreModel(),
      ),
      encode: validDate(message || 'Date invalide', (value) =>
        DateOnly.fromStoreModel(value).toFormattedString('yyyy-MM-dd'),
      ),
    });
  }

  private constructor(private readonly value: Date) {}

  toDate(): Date {
    return this.value;
  }

  // TODO: rename to `format`
  toFormattedString(template: 'dd-MM-yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd' = 'dd/MM/yyyy'): string {
    return format(this.value, template);
  }

  // TODO: rename to `toJSON`
  toStoreModel(): DateOnlyJson {
    const year = this.value.getFullYear();
    const month = this.value.getMonth() + 1;
    const day = this.value.getDate();

    return { year, month, day };
  }

  // TODO: rename to `fromJSON`
  static fromStoreModel(date: DateOnlyJson): DateOnly {
    return new DateOnly(assertIsValidDate(new Date(Date.UTC(date.year, date.month - 1, date.day))));
  }

  // FIXME: remove, this method does too many things
  static fromDateOnly(dateOnly: DateOnlyJson, format: 'dd/MM/yyyy' | 'yyyy-MM-dd' = 'dd/MM/yyyy'): string {
    return this.fromStoreModel(dateOnly).toFormattedString(format);
  }

  private static fromString(
    dateString: string,
    format: 'dd-MM-yyyy' | 'yyyy-MM-dd' = 'dd-MM-yyyy',
    locale = 'fr',
  ): DateOnly {
    const date = parse(dateString, format, new Date(), {
      locale: locale === 'fr' ? fr : undefined,
    });

    return new DateOnly(assertIsValidDate(date, `Date invalide: "${dateString}"`));
  }
}
