export type ReportAttachedFileSnapshot = {
  id: string;
  reportId: string;
  fileId: string;
};

export class ReportAttachedFile {
  constructor(
    private readonly id: string,
    private readonly reportId: string,
    private readonly fileId: string,
  ) {}

  toSnapshot(): ReportAttachedFileSnapshot {
    return {
      id: this.id,
      reportId: this.reportId,
      fileId: this.fileId,
    };
  }

  static fromSnapshot(
    snapshot: ReportAttachedFileSnapshot,
  ): ReportAttachedFile {
    return new ReportAttachedFile(
      snapshot.id,
      snapshot.reportId,
      snapshot.fileId,
    );
  }
}
