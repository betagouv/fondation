import { DateOnly } from 'src/shared-kernel/business-logic/models/dateOnly';

export type POSITION_CITY = 'PARIS' | 'PITRE';

export type NO_ASSIGNMENT = 'NO_ASSIGNMENT';
export type SECONDMENT = 'SECONDMENT';

export class PositionGeography {
  position: POSITION_CITY | NO_ASSIGNMENT | SECONDMENT;
  private readonly cityToOverseasMap = {
    PARIS: false,
    PITRE: true,
  };

  constructor(position: POSITION_CITY | NO_ASSIGNMENT | SECONDMENT) {
    this.position = position;
  }

  isNotAssigned(): boolean {
    return this.position === 'NO_ASSIGNMENT';
  }
  isSecondment(): boolean {
    return this.position === 'SECONDMENT';
  }

  isOverseas(): boolean | null {
    if (this.isNotAssigned() || this.isSecondment()) return null;

    return this.cityToOverseasMap[
      this.position as Exclude<
        PositionGeography['position'],
        'NO_ASSIGNMENT' | 'SECONDMENT'
      >
    ];
  }
}

export type NominationCaseSnapshot = {
  id: string;
  currentPositionStartDate: DateOnly;
  takingOfficeDate: DateOnly;
  profiledPosition: boolean;
  currentPositionGeography: PositionGeography;
  newPositionGeography: PositionGeography;
  hasNoAssignment: boolean;
};

export class NominationCase {
  constructor(
    readonly id: string,
    readonly currentPositionStartDate: DateOnly,
    readonly takingOfficeDate: DateOnly,
    readonly profiledPosition: boolean,
    readonly currentPositionGeography: PositionGeography,
    readonly newPositionGeography: PositionGeography,
  ) {}

  static fromSnapshot(snapshot: NominationCaseSnapshot): NominationCase {
    return new NominationCase(
      snapshot.id,
      snapshot.currentPositionStartDate,
      snapshot.takingOfficeDate,
      snapshot.profiledPosition,
      snapshot.currentPositionGeography,
      snapshot.newPositionGeography,
    );
  }
}
