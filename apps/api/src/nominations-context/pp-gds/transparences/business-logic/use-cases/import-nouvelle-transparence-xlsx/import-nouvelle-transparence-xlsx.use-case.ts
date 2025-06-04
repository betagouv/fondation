import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { TransparenceService } from '../../services/transparence.service';
import { ImportNouvelleTransparenceCommand as ImportNouvelleTransparenceXlsxCommande } from './Import-nouvelle-transparence-from-xlsx.command';

export class ImportNouvelleTransparenceXlsxUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceService: TransparenceService,
  ) {}

  execute(command: ImportNouvelleTransparenceXlsxCommande): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const transparence = await this.transparenceService.nouvelleTransparence(
        command.transparenceId,
        command.transparenceName,
        command.formation,
      )(trx);

      await this.transparenceService.créerDossiersImportés(
        transparence,
        command.nominationFilesPayload,
      )(trx);
    });
  }
}
