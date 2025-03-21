import {
  TransactionPerformer,
  TransactionableAsync,
} from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DrizzleDb } from '../repositories/drizzle/config/drizzle-instance';
import { z } from 'zod';

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
    try {
      return await this.db.transaction(async (tx) => {
        try {
          return await useCase(tx);
        } catch (err) {
          console.error('Error in transaction:', err);
          tx.rollback();
          throw err;
        }
      });
    } catch (err) {
      const retries = z.number().int().min(1).optional().parse(opts?.retries);

      if (retries) {
        return await this.perform(useCase, { retries: retries - 1 });
      }
      throw err;
    }
  }
}
