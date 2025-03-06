import { z } from 'zod';
import { ReportAttachedFile } from './report-attached-file';

export class ReportAttachedFiles {
  constructor(private readonly _files: ReportAttachedFile[] = []) {}

  addFile(file: ReportAttachedFile): ReportAttachedFiles {
    this._files.push(file);
    return new ReportAttachedFiles(this._files);
  }

  createURLForSignedUrls(fileServiceUrl: URL): URL {
    const url = new URL(fileServiceUrl);
    url.pathname = '/api/files/signed-urls';
    this._files.forEach(({ fileId }) => url.searchParams.append('ids', fileId));
    return url;
  }

  alreadyExists(file: ReportAttachedFile): boolean {
    return !!this._files.find((f) => f.isSameFile(file));
  }

  hasFiles() {
    return this._files.length > 0;
  }

  serialize() {
    const serializedFiles: z.infer<typeof attachedFilesValidationSchema> =
      this._files.map(({ fileId, name }) => ({
        fileId,
        name,
        usage: 'attachement',
      }));

    return attachedFilesValidationSchema.parse(serializedFiles);
  }

  getFileIds() {
    return this._files.map((f) => f.fileId);
  }

  removeFileByName(name: string): [ReportAttachedFiles, ReportAttachedFile] {
    const attachedFile = this._files.find((f) => f.name === name);
    if (!attachedFile) {
      throw new Error('File not found');
    }
    return [
      new ReportAttachedFiles(this._files.filter((f) => f.name !== name)),
      attachedFile,
    ];
  }
}

export const attachedFilesValidationSchema = z.union([
  z
    .object({
      usage: z.literal('attachement'),
      name: z.string(),
      fileId: z.string(),
    })
    .array(),
  z.null(),
]);
