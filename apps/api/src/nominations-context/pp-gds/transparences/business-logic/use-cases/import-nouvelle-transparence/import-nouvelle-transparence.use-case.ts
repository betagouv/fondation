import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { TransparenceService } from '../../services/transparence.service';
import { ImportNouvelleTransparenceCommand } from './Import-nouvelle-transparence.command';

export class ImportNouvelleTransparenceUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceService: TransparenceService,
  ) {}

  execute(command: ImportNouvelleTransparenceCommand): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const transparence =
        await this.transparenceService.nouvelleSession(command)(trx);

      await this.transparenceService.créerDossiersImportés(
        transparence,
        command.nominationFilesPayload,
      )(trx);
    });
  }
}
