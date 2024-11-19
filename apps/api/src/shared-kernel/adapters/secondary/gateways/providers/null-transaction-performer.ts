import {
  TransactionableAsync,
  TransactionPerformer,
} from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class NullTransactionPerformer implements TransactionPerformer {
  async perform<T>(
    useCase: TransactionableAsync<T>,
    cleanup?: () => Promise<void>,
  ): Promise<T> {
    try {
      return await useCase(null);
    } catch (err) {
      if (cleanup) {
        await cleanup();
      }
      throw err;
    }
  }
}
