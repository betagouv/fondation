import { isValid, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import z from 'zod';

export const dateOnlyJsonSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12),
  day: z.number().min(1).max(31),
});

export type DateOnlyJson = z.infer<typeof dateOnlyJsonSchema>;

const parisCalendar = new Intl.DateTimeFormat('fr', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'Europe/Paris',
  year: 'numeric',
});

export class DateOnly {
  private readonly value: Date;

  constructor(year: number, month: number, day: number) {
    // Month is 0-indexed in JS Date
    this.value = new Date(Date.UTC(year, month - 1, day));
    if (!isValid(this.value)) {
      throw new Error(`Invalid date: "${String(this.value)}"`);
    }
  }

  equals(other: DateOnly): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  toDate(): Date {
    return this.value;
  }

  // Only for date-fns, which always formats from the local calendar
  toLocalStartOfDay(): Date {
    return new Date(this.value.getUTCFullYear(), this.value.getUTCMonth(), this.value.getUTCDate());
  }

  // Counts days on the calendar rather than adding milliseconds, so a week never lands an hour
  // short of the next day when a DST switch falls in between
  plusDays(days: number): DateOnly {
    const { year, month, day } = this.toJson();
    return new DateOnly(year, month, day + days);
  }

  toJson(): DateOnlyJson {
    return {
      year: this.value.getUTCFullYear(),
      month: this.value.getUTCMonth() + 1,
      day: this.value.getUTCDate(),
    };
  }

  static fromJson(json: DateOnlyJson): DateOnly {
    return new DateOnly(json.year, json.month, json.day);
  }

  static fromUtcDate(date: Date): DateOnly {
    return new DateOnly(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  static fromOptionalUtcDate<T extends Date | null | undefined>(date: T): DateOnly | Exclude<T, Date> {
    if (date === undefined || date === null) return date as Exclude<T, Date>;
    return this.fromUtcDate(date);
  }

  static fromInstantInParis(instant: Date): DateOnly {
    const parts = parisCalendar.formatToParts(instant);
    const read = (type: 'day' | 'month' | 'year') => Number(parts.find((part) => part.type === type)?.value);

    return new DateOnly(read('year'), read('month'), read('day'));
  }

  static fromString(
    dateString: string,
    format: 'dd/MM/yyyy' | 'dd/M/yyyy' | 'yyyy-MM-dd' = 'dd/MM/yyyy',
    locale: 'fr' = 'fr',
  ): DateOnly {
    const date = parse(dateString, format, new Date(), {
      locale: locale === 'fr' ? fr : undefined,
    });

    return new DateOnly(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }
}
