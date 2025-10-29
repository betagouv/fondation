import {
  TransactionPerformer,
  TransactionableAsync,
} from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DrizzleDb } from '../repositories/drizzle/config/drizzle-instance';

export type DrizzleTransactionableAsync<T = void> = TransactionableAsync<
  T,
  Parameters<Parameters<DrizzleDb['transaction']>[0]>[0]
>;

export class DrizzleTransactionPerformer implements TransactionPerformer {
  constructor(private readonly db: DrizzleDb) {}

  async perform<T>(
    useCase: TransactionableAsync<T>,
    opts?: { retries: number },
  ): Promise<T> {
    let remainingAttemptsCount = opts?.retries || 1;

    return this.db.transaction(async (tx) => {
      const action = () => tx.transaction((txx) => useCase(txx));

      while (remainingAttemptsCount) {
        try {
          const result = await action();
          return result;
        } catch (err) {
          remainingAttemptsCount -= 1;
          if (!remainingAttemptsCount) throw err;
        }
      }

      throw new Error(`not reachable`);
    });
  }
}
