import {
  TransactionPerformer,
  TransactionableAsync,
} from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { z } from 'zod';
import { DrizzleDb } from '../repositories/drizzle/config/drizzle-instance';
import { AsyncLocalStorage } from 'node:async_hooks';

export type DrizzleTx = Parameters<Parameters<DrizzleDb['transaction']>[0]>[0];
export type DrizzleTransactionableAsync<T = void> = TransactionableAsync<T>;

const als = new AsyncLocalStorage<DrizzleTx>();

export class DrizzleTransactionPerformer implements TransactionPerformer {
  constructor(private readonly db: DrizzleDb) {}

  async perform<T>(
    useCase: TransactionableAsync<T>,
    opts?: { retries: number },
  ): Promise<T> {
    try {
      return await this.db.transaction(async (tx) => {
        try {
          return await als.run(tx, useCase);
        } catch (err) {
          console.error('Error in transaction:', err);
          tx.rollback();
          throw err;
        }
      });
    } catch (err) {
      const retries = z.number().int().optional().parse(opts?.retries);

      if (retries) {
        return await this.perform(useCase, { retries: retries - 1 });
      }
      throw err;
    }
  }
}

export const tx = () => {
  const store = als.getStore();
  if (!store) {
    throw new Error(
      'No transaction context available. Ensure you are using DrizzleTransactionPerformer.',
    );
  }
  return store;
};
