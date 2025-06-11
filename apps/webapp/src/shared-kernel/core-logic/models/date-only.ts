import { differenceInYears, format, isValid, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { z, ZodType } from "zod";

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type DateOnlyStoreModel = {
  year: number;
  month: Month;
  day: number;
};

export const dateOnlyJsonSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12) as ZodType<Month>,
  day: z.number().min(1).max(31),
});

export class DateOnly {
  private readonly value: Date;

  static ZOD_JSON_SCHEMA = dateOnlyJsonSchema;

  constructor(year: number, month: Month, day: number) {
    // Month is 0-indexed in JS Date
    this.value = new Date(Date.UTC(year, month - 1, day));
  }

  timeDiff(otherDate: DateOnly): number {
    return this.value.getTime() - otherDate.value.getTime();
  }

  equal(otherDate: DateOnly): unknown {
    return (
      this.getYear() === otherDate.getYear() &&
      this.getMonth() === otherDate.getMonth() &&
      this.getDay() === otherDate.getDay()
    );
  }

  toDate(): Date {
    return this.value;
  }
  toFormattedString(
    template: "dd-MM-yyyy" | "dd/MM/yyyy" = "dd/MM/yyyy",
  ): string {
    return format(this.value, template);
  }
  toStoreModel(): DateOnlyStoreModel {
    return {
      year: this.getYear(),
      month: this.getMonth(),
      day: this.getDay(),
    };
  }

  getAge(today: DateOnly): number {
    return this.yearsDiffWithLaterDate(today);
  }

  private yearsDiffWithLaterDate(today: DateOnly): number {
    return differenceInYears(today.toDate(), this.value);
  }

  private getYear(): number {
    return this.value.getFullYear();
  }
  private getMonth(): Month {
    return (this.value.getMonth() + 1) as Month;
  }
  private getDay(): number {
    return this.value.getDate();
  }

  static fromDate(date: Date): DateOnly {
    return new DateOnly(
      date.getFullYear(),
      (date.getMonth() + 1) as Month,
      date.getDate(),
    );
  }
  static fromStoreModel(date: DateOnlyStoreModel): DateOnly {
    return new DateOnly(date.year, date.month, date.day);
  }
  static now(): DateOnly {
    return DateOnly.fromDate(new Date());
  }

  static fromDateOnlyString = (dateString: string): DateOnly => {
    return this.fromString(dateString);
  };

  private static fromString(
    dateString: string,
    format = "dd-MM-yyyy",
    locale = "fr",
  ): DateOnly {
    const date = parse(dateString, format, new Date(), {
      locale: locale === "fr" ? fr : undefined,
    });
    if (!isValid(date)) {
      throw new Error("Invalid date: " + dateString);
    }

    return new this(
      date.getFullYear(),
      (date.getMonth() + 1) as Month,
      date.getDate(),
    );
  }
}
