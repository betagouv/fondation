import {
  TransactionPerformer,
  TransactionableAsync,
} from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { DrizzleDb } from '../repositories/drizzle/config/drizzle-instance';

export type DrizzleTransactionableAsync<T = void> = TransactionableAsync<
  T,
  Parameters<Parameters<DrizzleDb['transaction']>[0]>[0]
>;

export class DrizzleTransactionPerformer implements TransactionPerformer {
  constructor(private readonly db: DrizzleDb) {}

  async perform<T>(useCase: TransactionableAsync<T>): Promise<T> {
    return await this.db.transaction(async (tx) => {
      try {
        return await useCase(tx);
      } catch (err) {
        console.error(err);
        tx.rollback();
        throw err;
      }
    });
  }
}
