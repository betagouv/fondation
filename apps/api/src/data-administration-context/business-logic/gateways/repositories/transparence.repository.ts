import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { Transparence } from '../../models/transparence';
import { Magistrat, Transparency } from 'shared-models';

export interface TransparenceRepository {
  save(transparence: Transparence): TransactionableAsync;
  transparence(
    name: Transparency,
    formation: Magistrat.Formation,
  ): TransactionableAsync<Transparence | null>;
}
