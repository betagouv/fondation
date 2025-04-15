import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { FileModel } from '../../models/file';

export interface FileRepository {
  fileWithId(fileId: string): TransactionableAsync<FileModel | null>;
}
