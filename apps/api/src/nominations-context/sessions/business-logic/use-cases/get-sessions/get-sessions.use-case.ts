import { SessionSnapshot } from 'shared-models/models/session/session-content';
import { SessionRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/session.repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class GetSessionsUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(): Promise<SessionSnapshot[]> {
    return this.transactionPerformer.perform(async (trx) => {
      const sessions = await this.sessionRepository.findAll()(trx);
      return sessions.map((session) => session.snapshot());
    });
  }
}
