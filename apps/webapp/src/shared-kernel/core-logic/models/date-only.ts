import { differenceInYears, format, isValid, parse } from "date-fns";
import { fr } from "date-fns/locale";

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type DateOnlyStoreModel = {
  year: number;
  month: Month;
  day: number;
};

export class DateOnly {
  private readonly value: Date;

  constructor(year: number, month: Month, day: number) {
    // Month is 0-indexed in JS Date
    this.value = new Date(Date.UTC(year, month - 1, day));
  }

  timeDiff(other: DateOnly): number {
    return this.value.getTime() - other.value.getTime();
  }

  toDate(): Date {
    return this.value;
  }
  toFormattedString(): string {
    return format(this.value, "dd/MM/yyyy");
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
