import { Session } from 'src/nominations-context/sessions/business-logic/models/session';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export interface SessionRepository {
  findAll(): TransactionableAsync<Session[]>;
  save(transparence: Session): TransactionableAsync;
  session(id: string): TransactionableAsync<Session | null>;
  bySessionImportéeId(
    sessionImportéeId: string,
  ): TransactionableAsync<Session | null>;
}
