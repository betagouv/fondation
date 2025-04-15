import { FileRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/file-repository';
import { FileModel } from 'src/identity-and-access-context/business-logic/models/file';
import { FileType } from 'src/identity-and-access-context/business-logic/use-cases/file-read-permission/has-read-file-permission.use-case';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeFileRepository implements FileRepository {
  private files: Record<
    string,
    {
      fileId: string;
      type: FileType;
    }
  > = {};

  fileWithId(fileId: string): TransactionableAsync<FileModel | null> {
    return async () => {
      const file = this.files[fileId];
      if (!file) return null;

      return new FileModel(file.fileId, file.type);
    };
  }

  addFile(file: FileModel): void {
    this.files[file.fileId] = file;
  }
}
