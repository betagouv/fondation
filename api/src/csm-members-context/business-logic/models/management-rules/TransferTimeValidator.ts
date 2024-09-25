import { DateOnly } from 'src/shared-kernel/business-logic/models/dateOnly';

export class TransferTimeValidator {
  validate(
    currentPositionStartDate: DateOnly,
    takingOfficeDate: DateOnly,
  ): boolean {
    return (
      takingOfficeDate.differenceInMonthsWithEarlierDate(
        currentPositionStartDate,
      ) >= 35
    );
  }
}
