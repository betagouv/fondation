import {
  TransactionableAsync,
  TransactionPerformer,
} from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class NullTransactionPerformer implements TransactionPerformer {
  async perform<T>(useCase: TransactionableAsync<T>): Promise<T> {
    return useCase(null);
  }
}
