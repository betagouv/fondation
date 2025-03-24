export class UploadFilesError extends Error {
  constructor(
    public readonly failedFiles: Array<{
      fileId: string;
      fileName: string;
      bucket: string;
      filePath: string[] | null;
    }>,
  ) {
    super(
      'Failed to upload files with names: ' +
        failedFiles.map((f) => f.fileName).join(', '),
    );
    this.name = 'UploadFilesError';
  }
}
