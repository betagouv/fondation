import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { Transparence } from '../../models/transparence';

export interface TransparenceRepository {
  save(transparence: Transparence): TransactionableAsync;
}
