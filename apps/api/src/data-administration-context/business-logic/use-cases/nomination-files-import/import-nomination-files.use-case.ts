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
      } of nominationFilesPerTransparence) {
        const transparence =
          await this.transparenceService.transparence(transparency)(trx);

        if (!transparence) {
          await this.transparenceService.nouvelleTransparence(
            transparency,
            readCollection,
          )(trx);
        }

        const existingNominationFiles =
          await this.transparenceService.nominationFilesSnapshots(transparency)(
            trx,
          );

        await this.transparenceService.createNewNominationFiles(
          readCollection,
          existingNominationFiles,
        )(trx);

        await this.transparenceService.updateModifiedNominationFiles(
          readCollection,
          existingNominationFiles,
        )(trx);
      }
    });
  }
}
