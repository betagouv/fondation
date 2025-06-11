import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { TransparenceService } from '../../services/transparence.service';
import { ImportNouvelleTransparenceXlsxCommand } from './Import-nouvelle-transparence-xlsx.command';

export class ImportNouvelleTransparenceXlsxUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceService: TransparenceService,
  ) {}

  execute(command: ImportNouvelleTransparenceXlsxCommand): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const transparence = await this.transparenceService.nouvelleTransparence(
        command.transparenceId,
        command.transparenceName,
        command.formation,
        command.dateTransparence,
        command.dateClôtureDélaiObservation,
      )(trx);

      await this.transparenceService.créerDossiersXlsxImportés(
        transparence,
        command.nominationFilesPayload,
        command.dateEchéance,
      )(trx);
    });
  }
}
