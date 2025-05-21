export type ReporterSnapshot = {
  reporterId: string;
};

export class Reporter {
  constructor(private readonly _reporterId: string) {}

  public get reporterId(): string {
    return this._reporterId;
  }

  toSnapshot(): ReporterSnapshot {
    return {
      reporterId: this._reporterId,
    };
  }

  static fromSnapshot(snapshot: ReporterSnapshot): Reporter {
    return new Reporter(snapshot.reporterId);
  }
}
