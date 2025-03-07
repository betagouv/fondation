import FormData from 'form-data';
import { ReportFileUsage } from 'shared-models';
import { z } from 'zod';

export type ReportAttachedFileSnapshot = {
  name: string;
  fileId: string;
  usage: ReportFileUsage;
};

export class ReportAttachedFile {
  private _name: string;
  private _fileId: string;
  private _usage: ReportFileUsage;

  constructor(name: string, fileId: string, usage: ReportFileUsage) {
    this.name = name;
    this.fileId = fileId;
    this.usage = usage;
  }

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
  private set name(value: string) {
    this._name = z.string().parse(value);
  }

  public get fileId(): string {
    return this._fileId;
  }
  private set fileId(value: string) {
    this._fileId = z.string().parse(value);
  }

  public get usage(): ReportFileUsage {
    return this._usage;
  }
  private set usage(value: ReportFileUsage) {
    this._usage = z.nativeEnum(ReportFileUsage).parse(value);
  }

  toSnapshot(): ReportAttachedFileSnapshot {
    return {
      name: this.name,
      fileId: this.fileId,
      usage: this._usage,
    };
  }

  static fromSnapshot(
    snapshot: ReportAttachedFileSnapshot,
  ): ReportAttachedFile {
    return new ReportAttachedFile(
      snapshot.name,
      snapshot.fileId,
      snapshot.usage,
    );
  }
}
