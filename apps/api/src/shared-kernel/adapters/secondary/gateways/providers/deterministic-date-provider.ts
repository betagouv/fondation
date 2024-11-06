import { DateTimeProvider } from '../../../../business-logic/gateways/providers/date-time-provider';

export class DeterministicDateProvider implements DateTimeProvider {
  currentDate: Date;

  now(): Date {
    return this.currentDate;
  }
}
