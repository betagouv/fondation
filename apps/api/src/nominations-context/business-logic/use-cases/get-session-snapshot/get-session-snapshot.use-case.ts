import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { SessionRepository } from '../../gateways/repositories/session.repository';
import { SessionSnapshot } from '../../models/session';

export class GetSessionSnapshotUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(id: string): Promise<SessionSnapshot | null> {
    return this.transactionPerformer.perform(async (trx) => {
      const session = await this.sessionRepository.session(id)(trx);
      return session?.snapshot() ?? null;
    });
  }
}
