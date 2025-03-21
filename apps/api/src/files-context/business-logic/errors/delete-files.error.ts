import { FileDocumentSnapshot } from '../models/file-document';

export class DeleteFilesError extends Error {
  constructor(restoredFiles?: FileDocumentSnapshot[]) {
    super(
      `Error deleting files. Restored files are: ${restoredFiles?.map((file) => file.name).join(', ')}`,
    );
    this.name = 'DeleteFilesError';
  }
}
