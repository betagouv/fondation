import { differenceInYears, format } from "date-fns";

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
}
