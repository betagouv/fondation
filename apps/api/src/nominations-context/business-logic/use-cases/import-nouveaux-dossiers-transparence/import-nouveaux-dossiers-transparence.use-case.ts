import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { TransparenceService } from '../../services/transparence.service';
import { ImportNouveauxDossiersTransparenceCommand } from './import-nouveaux-dossiers-transparence.command';
import { SessionNotFoundError } from '../../errors/session-not-found.error';
import { SessionRepository } from '../../gateways/repositories/session.repository';

export class ImportNouveauxDossiersTransparenceUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly sessionRepository: SessionRepository,
    private readonly transparenceService: TransparenceService,
  ) {}

  execute(command: ImportNouveauxDossiersTransparenceCommand): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const session = await this.sessionRepository.session(
        command.transparenceId,
      )(trx);

      if (!session) {
        throw new SessionNotFoundError(command.transparenceId);
      }

      await this.transparenceService.créerDossiersImportés(
        session,
        command.nominationFiles,
      )(trx);
    });
  }
}
