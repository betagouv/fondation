import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { TransparenceService } from '../../services/transparence.service';

export class ImportNominationFilesUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceService: TransparenceService,
  ) {}

  async execute(fileContentToImport: string): Promise<void> {
    const nominationFilesPerTransparence =
      this.transparenceService.readFromTsvFile(fileContentToImport);

    return this.transactionPerformer.perform(async (trx) => {
      for (const {
        readCollection,
        transparency,
        formation,
      } of nominationFilesPerTransparence) {
        const transparence = await this.transparenceService.transparence(
          transparency,
          formation,
          {
            year: 2025,
            month: 6,
            day: 13,
          },
        )(trx);

        if (transparence) {
          await this.transparenceService.updateTransparence(
            transparence,
            readCollection,
          )(trx);
        } else {
          await this.transparenceService.nouvelleTransparence(
            transparency,
            formation,
            readCollection,
          )(trx);
        }
      }
    });
  }
}
