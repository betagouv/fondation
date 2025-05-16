import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';

export class DeterministicDateProvider implements DateTimeProvider {
  currentDate: Date = new Date(2000, 1, 1);

  now(): Date {
    return this.currentDate;
  }
}
