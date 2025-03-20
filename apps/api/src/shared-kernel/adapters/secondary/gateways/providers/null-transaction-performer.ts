import {
  TransactionableAsync,
  TransactionPerformer,
} from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class NullTransactionPerformer implements TransactionPerformer {
  constructor(private readonly rollback?: () => void) {}

  async perform<T>(
    useCase: TransactionableAsync<T>,
    opts?: { retries: number },
  ): Promise<T> {
    try {
      return await useCase(null);
    } catch (err) {
      this.rollback?.();
      if (opts?.retries) {
        return this.perform(useCase, { retries: opts.retries - 1 });
      }
      throw err;
    }
  }
}
