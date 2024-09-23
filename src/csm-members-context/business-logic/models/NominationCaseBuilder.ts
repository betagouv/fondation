import { DateOnly } from 'src/shared-kernel/business-logic/models/dateOnly';
import { NominationCase } from './NominationCase';

export class NominationCaseBuilder {
  private nominationCaseId: string;
  private currentPositionStartDate: DateOnly;
  private takingOfficeDate: DateOnly;
  private profiledPosition: boolean;

  constructor() {
    this.nominationCaseId = 'nomination-id';
    this.currentPositionStartDate = new DateOnly(2022, 1, 20);
    this.takingOfficeDate = new DateOnly(2025, 1, 20);
    this.profiledPosition = false;
  }

  withCurrentPositionStartDate(currentPositionStartDate: DateOnly) {
    this.currentPositionStartDate = currentPositionStartDate;
    return this;
  }

  withProfiledPosition(profiledPosition: boolean) {
    this.profiledPosition = profiledPosition;
    return this;
  }

  build() {
    return new NominationCase(
      this.nominationCaseId,
      this.currentPositionStartDate,
      this.takingOfficeDate,
      this.profiledPosition,
    );
  }
}
