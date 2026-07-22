import { isValid, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import z from 'zod';

export const dateOnlyJsonSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12),
  day: z.number().min(1).max(31),
});

export type DateOnlyJson = z.infer<typeof dateOnlyJsonSchema>;

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

  toJson(): DateOnlyJson {
    return {
      year: this.value.getFullYear(),
      month: this.value.getMonth() + 1,
      day: this.value.getDate(),
    };
  }

  static fromJson(json: DateOnlyJson): DateOnly {
    return new DateOnly(json.year, json.month, json.day);
  }

  static fromOptionalDate<T extends Date | null | undefined>(date: T): DateOnly | Exclude<T, Date> {
    if (date === undefined || date === null) return date as Exclude<T, Date>;
    return this.fromDate(date);
  }

  static fromDate(dueDate: Date): DateOnly {
    return new DateOnly(dueDate.getFullYear(), dueDate.getMonth() + 1, dueDate.getDate());
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
