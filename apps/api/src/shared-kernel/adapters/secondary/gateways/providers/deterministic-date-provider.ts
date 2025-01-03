import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';

export class DeterministicDateProvider implements DateTimeProvider {
  currentDate: Date;

  now(): Date {
    return this.currentDate;
  }
}
