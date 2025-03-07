import { z } from 'zod';
import { ReportAttachedFile } from './report-attached-file';
import { ReportFileUsage } from 'shared-models';

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

  alreadyExists(file: ReportAttachedFile): boolean {
    return !!this._files.find((f) => f.isSameFile(file));
  }

  hasFiles() {
    return this._files.length > 0;
  }

  serialize() {
    const serializedFiles: z.infer<typeof attachedFilesValidationSchema> =
      this._files.map(({ fileId, name, usage }) => ({
        fileId,
        name,
        usage,
      }));

    return attachedFilesValidationSchema.parse(serializedFiles);
  }

  byName(name: string) {
    return this._files.find((f) => f.name === name);
  }

  getFileIds() {
    return this._files.map((f) => f.fileId);
  }

  toSnapshot() {
    return this._files.map((f) => f.toSnapshot());
  }

  static deserialize(files: unknown) {
    return new ReportAttachedFiles(
      attachedFilesValidationSchema
        .parse(files)
        ?.map(
          (file) => new ReportAttachedFile(file.name, file.fileId, file.usage),
        ),
    );
  }
}

export const attachedFilesValidationSchema = z.union([
  z
    .object({
      usage: z.nativeEnum(ReportFileUsage),
      name: z.string(),
      fileId: z.string(),
    })
    .array(),
  z.null(),
]);

export type ReportAttachedFilesSerialized = z.infer<
  typeof attachedFilesValidationSchema
>;
