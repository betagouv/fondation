import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export interface SessionProvider {
  createSession(
    userId: string,
    expiresInDays: number,
  ): TransactionableAsync<string>;
}
