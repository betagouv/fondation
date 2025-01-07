import { SessionRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/session-repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class ValidateSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(sessionId: string): Promise<boolean> {
    return this.transactionPerformer.perform(async (trx) => {
      const session = await this.sessionRepository.session(sessionId)(trx);
      return session !== null;
    });
  }
}
