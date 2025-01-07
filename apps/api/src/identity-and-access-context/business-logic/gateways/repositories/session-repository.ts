import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserSession } from '../../models/session';

export interface SessionRepository {
  create(session: UserSession): TransactionableAsync;
  session(sessionId: string): TransactionableAsync<UserSession | null>;
  deleteSession(sessionId: string): TransactionableAsync;
}
