import { FileDocument } from 'src/files-context/business-logic/models/file-document';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export interface TransparenceFileRepository {
  create(transparenceId: string, fileId: string): TransactionableAsync;
  findBySessionImportId(
    transparenceId: string,
  ): TransactionableAsync<FileDocument[]>;
}
