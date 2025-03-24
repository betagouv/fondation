import { FileRepository } from 'src/files-context/business-logic/gateways/repositories/file-repository';
import {
  FileDocument,
  FileDocumentSnapshot,
} from 'src/files-context/business-logic/models/file-document';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

type FileId = string;

export class FakeFileRepository implements FileRepository {
  files: Record<FileId, FileDocumentSnapshot> = {};
  saveFileError: Error;
  saveFileErrorCount = 0;
  saveFileErrorCountLimit = Infinity;
  deleteFileError: Error;
  deleteFilesError: Error;
  deleteFilesErrorIndex = 0;
  deleteFilesErrorCount = 0;
  deleteFilesErrorCountLimit = Infinity;

  save(file: FileDocument): TransactionableAsync {
    return async () => {
      if (
        this.saveFileError &&
        this.saveFileErrorCount < this.saveFileErrorCountLimit
      ) {
        this.saveFileErrorCount += 1;
        throw this.saveFileError;
      }

      const fileSnapshot = file.toSnapshot();
      this.files[fileSnapshot.id] = fileSnapshot;
    };
  }

  getByIds(ids: string[]): TransactionableAsync<FileDocument[]> {
    return async () =>
      ids.map((id) => FileDocument.fromSnapshot(this.files[id]!));
  }

  deleteFile(file: FileDocument): TransactionableAsync {
    return async () => {
      if (this.deleteFileError) throw this.deleteFileError;

      if (file) delete this.files[file.id];
    };
  }

  deleteFiles(files: FileDocument[]): TransactionableAsync {
    return async () => {
      for (const [index, file] of files.entries()) {
        if (
          this.deleteFilesError &&
          this.deleteFilesErrorIndex === index &&
          this.deleteFilesErrorCount++ < this.deleteFilesErrorCountLimit
        )
          throw this.deleteFilesError;
        delete this.files[file.id];
      }
    };
  }
}
