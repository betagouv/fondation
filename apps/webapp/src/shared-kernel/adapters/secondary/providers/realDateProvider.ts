import { DateProvider } from "../../../core-logic/providers/dateProvider";

export class RealDateProvider implements DateProvider {
  currentTimestamp(): number {
    return Date.now();
  }
}
