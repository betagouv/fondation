export type ReportAttachedFileSnapshot = {
  id: string;
  createdAt: Date;
  reportId: string;
  name: string;
};

export class ReportAttachedFile {
  constructor(
    private readonly id: string,
    private readonly createdAt: Date,
    private readonly reportId: string,
    private readonly _name: string,
  ) {}

  public get name(): string {
    return this._name;
  }

  toSnapshot(): ReportAttachedFileSnapshot {
    return {
      id: this.id,
      createdAt: this.createdAt,
      reportId: this.reportId,
      name: this.name,
    };
  }

  static fromSnapshot(
    snapshot: ReportAttachedFileSnapshot,
  ): ReportAttachedFile {
    return new ReportAttachedFile(
      snapshot.id,
      snapshot.createdAt,
      snapshot.reportId,
      snapshot.name,
    );
  }
}
