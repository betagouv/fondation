import { FileType } from 'src/identity-and-access-context/business-logic/models/file-type';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export interface FileRepository {
  create(fileId: string, fileType: FileType): TransactionableAsync;
}
