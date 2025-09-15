import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { Session } from '../../models/session';

export interface SessionRepository {
  findAll(): TransactionableAsync<Session[]>;
  save(transparence: Session): TransactionableAsync;
  session(id: string): TransactionableAsync<Session | null>;
  bySessionImportéeId(
    sessionImportéeId: string,
  ): TransactionableAsync<Session | null>;
}
