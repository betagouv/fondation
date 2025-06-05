import { differenceInMonths, format, isValid, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { z, ZodType } from 'zod';

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type DateOnlyJson = {
  year: number;
  month: Month;
  day: number;
};

const dbDateFormat = 'yyyy-MM-dd';
export const gsheetDateFormat = 'dd/MM/yyyy';

export const dateOnlyJsonSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12) as ZodType<Month>,
  day: z.number(),
});

export class DateOnly {
  private readonly value: Date;

  static ZOD_JSON_SCHEMA = dateOnlyJsonSchema;

  constructor(year: number, month: Month, day: number) {
    // Month is 0-indexed in JS Date
    this.value = new Date(Date.UTC(year, month - 1, day));
  }

  differenceInMonthsWithEarlierDate(earlierDate: DateOnly): number {
    return differenceInMonths(this.value, earlierDate.value);
  }
  getYear(): number {
    return this.value.getFullYear();
  }
  getMonth(): number {
    return this.value.getMonth() + 1; // Returns 1-indexed month
  }
  toDate(): Date {
    return this.value;
  }
  toFormattedString(
    formatTemplate: 'yyyy-MM-dd' | typeof gsheetDateFormat = 'yyyy-MM-dd',
  ): string {
    return format(this.value, formatTemplate);
  }
  toJson(): DateOnlyJson {
    return {
      year: this.getYear(),
      month: this.getMonth() as Month,
      day: this.value.getDate(),
    };
  }
  static fromJson(json: DateOnlyJson): DateOnly {
    return new DateOnly(json.year, json.month, json.day);
  }
  toDbString(): string {
    return format(this.value, dbDateFormat);
  }

  static fromDate(dueDate: Date): DateOnly {
    return new DateOnly(
      dueDate.getFullYear(),
      (dueDate.getMonth() + 1) as Month,
      dueDate.getDate(),
    );
  }

  static fromDbDateOnlyString = (dateString: string): DateOnly => {
    return this.fromString(dateString, dbDateFormat);
  };

  static fromString(
    dateString: string,
    format: 'dd/MM/yyyy' | 'dd/M/yyyy' | typeof dbDateFormat = 'dd/MM/yyyy',
    locale: 'fr' = 'fr',
  ): DateOnly {
    const date = parse(dateString, format, new Date(), {
      locale: locale === 'fr' ? fr : undefined,
    });
    if (!isValid(date)) {
      throw new Error('Invalid date: ' + dateString);
    }

    return new this(
      date.getFullYear(),
      (date.getMonth() + 1) as Month,
      date.getDate(),
    );
  }
}
