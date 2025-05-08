import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { Affectation } from '../../models/affectation';
import { Magistrat } from 'shared-models';

export interface AffectationRepository {
  save(affectation: Affectation): TransactionableAsync;
  affectations(
    sessionId: string,
  ): TransactionableAsync<Record<Magistrat.Formation, Affectation>>;
}
