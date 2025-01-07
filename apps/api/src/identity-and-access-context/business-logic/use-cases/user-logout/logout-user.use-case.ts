import { SessionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/session-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class LogoutUserUseCase {
  constructor(
    private readonly sessionProvider: SessionProvider,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(sessionId: string): Promise<void> {
    await this.transactionPerformer.perform(async (trx) => {
      await this.sessionProvider.invalidateSession(sessionId)(trx);
    });
  }
}
