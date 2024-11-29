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
    cleanup?: () => Promise<void>,
  ): Promise<T> {
    return await this.db.transaction(async (tx) => {
      try {
        return await useCase(tx);
      } catch (err) {
        if (cleanup) {
          await cleanup();
        }
        tx.rollback();
        throw err;
      }
    });
  }
}
