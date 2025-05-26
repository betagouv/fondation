import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { TransparenceCsv } from '../../models/transparence-csv';

export interface TransparenceCsvRepository {
  enregistrerCsv(transparenceCsv: TransparenceCsv): TransactionableAsync;
}
