import { DateProvider } from "../../../core-logic/providers/dateProvider";

export class DeterministicDateProvider implements DateProvider {
  timestamp = 10;

  currentTimestamp(): number {
    return this.timestamp;
  }
}
