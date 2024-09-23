import { DateOnly } from 'src/shared-kernel/business-logic/models/dateOnly';

export class NominationCase {
  constructor(
    public readonly id: string,
    public readonly currentPositionStartDate: DateOnly,
    public readonly takingOfficeDate: DateOnly,
  ) {}
}
