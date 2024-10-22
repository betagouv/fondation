import {
  TransactionPerformer,
  TransactionableAsync,
} from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { DrizzleDb } from '../repositories/drizzle/drizzle-instance';

export type DrizzleTransactionableAsync<T> = TransactionableAsync<
  T,
  Parameters<Parameters<DrizzleDb['transaction']>[0]>[0]
>;

export class DrizzleTransactionPerformer implements TransactionPerformer {
  constructor(private readonly db: DrizzleDb) {}

  async perform<T>(useCase: TransactionableAsync<T>): Promise<T> {
    return await this.db.transaction(async (tx) => {
      return await useCase(tx);
    });
  }
}
