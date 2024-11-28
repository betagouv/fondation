import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { FileDocument } from '../../models/file-document';

export interface FileRepository {
  save(file: FileDocument): TransactionableAsync;
  getByIds(ids: string[]): TransactionableAsync<FileDocument[]>;
  deleteFile(file: FileDocument): TransactionableAsync;
}
