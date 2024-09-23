import { DateOnly } from 'src/shared-kernel/business-logic/models/dateOnly';
import {
  NominationCase,
  POSITION_CITY,
  PositionGeography,
} from './NominationCase';

export class NominationCaseBuilder {
  private nominationCaseId: string;
  private currentPositionStartDate: DateOnly;
  private takingOfficeDate: DateOnly;
  private profiledPosition: boolean;
  private currentPositionGeography: PositionGeography;
  private newPositionGeography: PositionGeography;
  private hasNoAssignment: boolean;

  constructor() {
    this.nominationCaseId = 'nomination-id';
    this.currentPositionStartDate = new DateOnly(2022, 1, 20);
    this.takingOfficeDate = new DateOnly(2025, 1, 20);
    this.profiledPosition = false;
    this.currentPositionGeography = new PositionGeography('PARIS');
    this.newPositionGeography = new PositionGeography('PARIS');
  }

  withCurrentPositionStartDate(currentPositionStartDate: DateOnly) {
    this.currentPositionStartDate = currentPositionStartDate;
    return this;
  }
  withProfiledPosition(profiledPosition: boolean) {
    this.profiledPosition = profiledPosition;
    return this;
  }
  withCurrentPositionCity(currentPositionCity: POSITION_CITY) {
    this.currentPositionGeography = new PositionGeography(currentPositionCity);
    return this;
  }
  withNewPositionCity(newPositionCity: POSITION_CITY) {
    this.newPositionGeography = new PositionGeography(newPositionCity);
    return this;
  }
  withNoAssignment() {
    this.currentPositionGeography = new PositionGeography('NO_ASSIGNMENT');
    return this;
  }
  withSecondment() {
    this.currentPositionGeography = new PositionGeography('SECONDMENT');
    return this;
  }

  build() {
    return NominationCase.fromSnapshot({
      id: this.nominationCaseId,
      currentPositionStartDate: this.currentPositionStartDate,
      takingOfficeDate: this.takingOfficeDate,
      profiledPosition: this.profiledPosition,
      currentPositionGeography: this.currentPositionGeography,
      newPositionGeography: this.newPositionGeography,
      hasNoAssignment: this.hasNoAssignment,
    });
  }
}
