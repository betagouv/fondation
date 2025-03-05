import FormData from 'form-data';

export type ReportAttachedFileSnapshot = {
  reportId: string;
  name: string;
  fileId: string;
};

export class ReportAttachedFile {
  constructor(
    private readonly _reportId: string,
    private readonly _name: string,
    private readonly _fileId: string,
  ) {}

  isSameFile(file: ReportAttachedFile): boolean {
    return this._fileId === file._fileId;
  }

  generateUploadFormData(fileBuffer: Buffer): FormData {
    const formData = new FormData();
    formData.append('file', fileBuffer, this._name);
    return formData;
  }

  generateUploadHref(
    fileServiceUrl: URL,
    bucket: string,
    path: string[],
  ): string {
    const url = new URL(fileServiceUrl);
    url.pathname = '/api/files/upload-one';
    url.searchParams.append('bucket', bucket);
    path.forEach((p) => url.searchParams.append('path', p));
    url.searchParams.append('fileId', this._fileId);
    return url.href;
  }

  generateDeleteUrl(fileServiceUrl: URL): URL {
    const deleteUrl = new URL(fileServiceUrl);
    deleteUrl.pathname = `/api/files/${this._fileId}`;
    return deleteUrl;
  }

  public get name(): string {
    return this._name;
  }
  public get fileId(): string {
    return this._fileId;
  }
  public get reportId(): string {
    return this._reportId;
  }

  toSnapshot(): ReportAttachedFileSnapshot {
    return {
      reportId: this._reportId,
      name: this.name,
      fileId: this.fileId,
    };
  }

  static fromSnapshot(
    snapshot: ReportAttachedFileSnapshot,
  ): ReportAttachedFile {
    return new ReportAttachedFile(
      snapshot.reportId,
      snapshot.name,
      snapshot.fileId,
    );
  }
}
