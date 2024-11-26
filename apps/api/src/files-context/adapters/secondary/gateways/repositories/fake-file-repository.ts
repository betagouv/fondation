import { FileRepository } from 'src/files-context/business-logic/gateways/repositories/file-repository';
import {
  FileDocument,
  FileDocumentSnapshot,
} from 'src/files-context/business-logic/models/file-document';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

type FileId = string;

export class FakeFileRepository implements FileRepository {
  files: Record<FileId, FileDocumentSnapshot> = {};
  saveError: Error;

  save(file: FileDocument): TransactionableAsync {
    if (this.saveError) throw this.saveError;

    return async () => {
      const fileSnapshot = file.toSnapshot();
      this.files[fileSnapshot.id] = fileSnapshot;
    };
  }

  getByNames(fileNames: string[]): TransactionableAsync<FileDocument[]> {
    return async () =>
      fileNames.map((name) =>
        FileDocument.fromSnapshot(
          Object.values(this.files).find((file) => file.name === name)!,
        ),
      );
  }
}
