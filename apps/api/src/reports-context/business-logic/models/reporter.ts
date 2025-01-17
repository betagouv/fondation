import { FullName } from './full-name';

export type ReporterSnapshot = {
  reporterId: string;
  firstName: string;
  lastName: string;
};

export class Reporter {
  constructor(
    private readonly _reporterId: string,
    private _fullName: FullName,
  ) {}

  public get reporterId(): string {
    return this._reporterId;
  }

  public get fullName(): FullName {
    return this._fullName;
  }

  toSnapshot(): ReporterSnapshot {
    return {
      reporterId: this._reporterId,
      firstName: this._fullName.firstName,
      lastName: this._fullName.lastName,
    };
  }

  static fromSnapshot(snapshot: ReporterSnapshot): Reporter {
    return new Reporter(
      snapshot.reporterId,
      new FullName(snapshot.firstName, snapshot.lastName),
    );
  }
}
