import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { Session } from '../../models/session';

export interface SessionRepository {
  save(transparence: Session): TransactionableAsync;
  session(id: string): TransactionableAsync<Session | null>;
}
