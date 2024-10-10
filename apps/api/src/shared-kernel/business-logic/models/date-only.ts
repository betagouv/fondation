import { differenceInMonths } from 'date-fns';

type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export class DateOnly {
  private readonly value: Date;

  constructor(year: number, month: Month, day: number) {
    this.value = new Date(year, month - 1, day); // Month is 0-indexed in JS Date
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
}
