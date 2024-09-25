import { DateOnly } from 'src/shared-kernel/business-logic/models/dateOnly';
import { PositionGeography } from './PositionGeography';
import { Position, PositionTitle } from './Position';

export type NominationCaseSnapshot = {
  id: string;
  currentPositionStartDate: DateOnly;
  takingOfficeDate: DateOnly;
  profiledPosition: boolean;
  currentPositionGeography: PositionGeography;
  newPositionGeography: PositionGeography;
  hasNoAssignment: boolean;
  currentPositionTitle: PositionTitle;
  newPositionTitle: PositionTitle;
};

export class NominationCase {
  constructor(
    readonly id: string,
    readonly currentPositionStartDate: DateOnly,
    readonly takingOfficeDate: DateOnly,
    readonly profiledPosition: boolean,
    readonly currentPosition: Position,
    readonly newPosition: Position,
  ) {}

  static fromSnapshot(snapshot: NominationCaseSnapshot): NominationCase {
    return new NominationCase(
      snapshot.id,
      snapshot.currentPositionStartDate,
      snapshot.takingOfficeDate,
      snapshot.profiledPosition,
      new Position(
        snapshot.currentPositionTitle,
        snapshot.currentPositionGeography,
      ),
      new Position(snapshot.newPositionTitle, snapshot.newPositionGeography),
    );
  }

  toString(): string {
    return `
        NominationCase: ${this.id}.
          Current position: ${this.currentPosition.title} in ${this.currentPosition.geography.location}.
          New position: ${this.newPosition.title} in ${this.newPosition.geography.location}.
          Profiled position: ${this.profiledPosition}.
          Current position start date: ${this.currentPositionStartDate}.
          Taking office date: ${this.takingOfficeDate}.
      `;
  }
}
