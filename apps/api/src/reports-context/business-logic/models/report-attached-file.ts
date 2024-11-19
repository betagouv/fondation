export type ReportAttachedFileSnapshot = {
  id: string;
  createdAt: Date;
  reportId: string;
  fileId: string;
};

export class ReportAttachedFile {
  constructor(
    private readonly id: string,
    private readonly createdAt: Date,
    private readonly reportId: string,
    private readonly fileId: string,
  ) {}

  toSnapshot(): ReportAttachedFileSnapshot {
    return {
      id: this.id,
      createdAt: this.createdAt,
      reportId: this.reportId,
      fileId: this.fileId,
    };
  }

  static fromSnapshot(
    snapshot: ReportAttachedFileSnapshot,
  ): ReportAttachedFile {
    return new ReportAttachedFile(
      snapshot.id,
      snapshot.createdAt,
      snapshot.reportId,
      snapshot.fileId,
    );
  }
}
