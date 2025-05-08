import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { Analyse } from '../../models/analyse';

export class CréerAnalyseCommand {
  constructor(readonly _rapportId: string) {}
}

export class CréerAnalyseUseCase {
  constructor(private readonly transactionPerformer: TransactionPerformer) {}

  execute(command: CréerAnalyseCommand): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      await Analyse.créer(command._rapportId)(trx);
    });
  }
}
