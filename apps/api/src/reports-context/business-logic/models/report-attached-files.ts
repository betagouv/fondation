import { ReportAttachedFile } from './report-attached-file';

export class ReportAttachedFiles {
  constructor(private readonly _files: ReportAttachedFile[] = []) {}

  alreadyExists(file: ReportAttachedFile): boolean {
    return !!this._files.find((f) => f.isSameFile(file));
  }

  createURLForSignedUrls(fileServiceUrl: URL): URL {
    const url = new URL(fileServiceUrl);
    url.pathname = '/api/files/signed-urls';
    this._files.forEach(({ fileId }) => url.searchParams.append('ids', fileId));
    return url;
  }

  hasFiles() {
    return this._files.length > 0;
  }

  getFileIds() {
    return this._files.map((f) => f.fileId);
  }
}
