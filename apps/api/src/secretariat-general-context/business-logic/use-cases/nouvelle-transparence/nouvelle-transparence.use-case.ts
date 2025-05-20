import { NouvelleTransparenceDto } from 'shared-models';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
export class NouvelleTransparenceUseCase {
  constructor(private readonly transactionPerformer: TransactionPerformer) {}

  async execute(nouvelleTransparence: NouvelleTransparenceDto) {
    return this.transactionPerformer.perform(async (trx) => {
      console.log(
        'use case, voici ma nouvelle transparenc',
        nouvelleTransparence,
        trx,
      );
    });
  }
}
