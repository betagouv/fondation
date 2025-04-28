import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { Session } from '../../models/session';

export interface TransparenceRepository {
  save(transparence: Session): TransactionableAsync;
}
