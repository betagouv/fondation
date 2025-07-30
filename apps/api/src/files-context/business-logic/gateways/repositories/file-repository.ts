import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import {
  FileDocument,
  FileDocumentWithoutId,
} from '../../models/file-document';

export interface FileRepository {
  create(file: FileDocumentWithoutId): TransactionableAsync;
  save(file: FileDocument): TransactionableAsync;
  getByIds(ids: string[]): TransactionableAsync<FileDocument[]>;
  deleteFile(file: FileDocument): TransactionableAsync;
  deleteFiles(files: FileDocument[]): TransactionableAsync;
}
