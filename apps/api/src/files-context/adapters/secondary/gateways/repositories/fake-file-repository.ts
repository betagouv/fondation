import { FileRepository } from 'src/files-context/business-logic/gateways/repositories/file-repository';
import {
  FileDocument,
  FileDocumentSnapshot,
} from 'src/files-context/business-logic/models/file-document';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeFileRepository implements FileRepository {
  readonly files: Record<string, FileDocumentSnapshot> = {};
  saveError: Error;

  save(file: FileDocument): TransactionableAsync {
    if (this.saveError) throw this.saveError;

    return async () => {
      const fileSnapshot = file.toSnapshot();
      this.files[fileSnapshot.id] = fileSnapshot;
    };
  }
}
