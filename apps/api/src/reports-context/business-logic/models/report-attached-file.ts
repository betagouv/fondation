import FormData from 'form-data';
import { reportAttachedFiles } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema';

export type ReportAttachedFileSnapshot = {
  createdAt: Date;
  reportId: string;
  name: string;
  fileId: string;
};

export class ReportAttachedFile {
  constructor(
    private readonly createdAt: Date,
    private readonly reportId: string,
    private readonly _name: string,
    private readonly _fileId: string,
  ) {}

  generateAttachedFilePath(): string {
    return this.reportId;
  }

  generateFormData(fileBuffer: Buffer): FormData {
    const formData = new FormData();
    formData.append('file', fileBuffer, this._name);
    return formData;
  }

  generateUrlHref(fileServiceUrl: URL, bucket: string): string {
    const url = new URL(fileServiceUrl);
    url.pathname = '/api/files/upload-one';
    url.searchParams.append('bucket', bucket);
    url.searchParams.append('path', this.generateAttachedFilePath());
    url.searchParams.append('fileId', this._fileId);
    return url.href;
  }

  public get name(): string {
    return this._name;
  }
  public get fileId(): string {
    return this._fileId;
  }

  toSnapshot(): ReportAttachedFileSnapshot {
    return {
      createdAt: this.createdAt,
      reportId: this.reportId,
      name: this.name,
      fileId: this.fileId,
    };
  }

  static fromSnapshot(
    snapshot: ReportAttachedFileSnapshot,
  ): ReportAttachedFile {
    return new ReportAttachedFile(
      snapshot.createdAt,
      snapshot.reportId,
      snapshot.name,
      snapshot.fileId,
    );
  }

  static fromDb(file: typeof reportAttachedFiles.$inferSelect) {
    return new ReportAttachedFile(
      file.createdAt,
      file.reportId,
      file.name,
      file.fileId,
    );
  }
}
