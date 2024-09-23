import { DateOnly } from 'src/shared-kernel/business-logic/models/dateOnly';

export class NominationCase {
  constructor(
    readonly id: string,
    readonly currentPositionStartDate: DateOnly,
    readonly takingOfficeDate: DateOnly,
    readonly profiledPosition: boolean,
  ) {}
}
