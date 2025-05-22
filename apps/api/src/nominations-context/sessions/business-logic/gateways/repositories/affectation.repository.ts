import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { Affectation } from '../../models/affectation';

export interface AffectationRepository {
  save(affectation: Affectation): TransactionableAsync;
  bySessionId(sessionId: string): TransactionableAsync<Affectation | null>;
}
