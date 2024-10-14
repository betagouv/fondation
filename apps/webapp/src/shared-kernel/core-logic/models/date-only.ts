import { format } from "date-fns";

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

  getYear(): number {
    return this.value.getFullYear();
  }
  getMonth(): number {
    return this.value.getMonth() + 1;
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
      month: this.getMonth() as Month,
      day: this.value.getDate(),
    };
  }

  static fromDate(dueDate: Date): DateOnly {
    return new DateOnly(
      dueDate.getFullYear(),
      (dueDate.getMonth() + 1) as Month,
      dueDate.getDate(),
    );
  }
  static fromStoreModel(date: DateOnlyStoreModel): DateOnly {
    return new DateOnly(date.year, date.month, date.day);
  }
}
