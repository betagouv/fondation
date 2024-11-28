import {
  TransactionableAsync,
  TransactionPerformer,
} from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class NullTransactionPerformer implements TransactionPerformer {
  constructor(private readonly rollback?: () => void) {}

  async perform<T>(
    useCase: TransactionableAsync<T>,
    cleanup?: () => Promise<void>,
  ): Promise<T> {
    try {
      return await useCase(null);
    } catch (err) {
      this.rollback?.();
      if (cleanup) {
        await cleanup();
      }
      throw err;
    }
  }
}
