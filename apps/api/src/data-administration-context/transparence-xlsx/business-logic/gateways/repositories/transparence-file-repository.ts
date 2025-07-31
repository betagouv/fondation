import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export interface TransparenceFileRepository {
  // Shall create an entry in the transparence_files table
  create(transparenceId: string, fileId: string): TransactionableAsync;
}
