import { DateOnlyJson, Magistrat } from 'shared-models';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { TransparenceCsv } from '../../models/transparence-csv';
import { XlsxReader } from '../../models/xlsx-reader';
import { TransparenceService } from '../../services/transparence.service';

export class ImportObservantsXlsxUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceService: TransparenceService,
  ) {}

  async execute(
    file: File,
    formation: Magistrat.Formation,
    nomTransparence: string,
    dateTransparence: DateOnlyJson,
  ): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const xlsxRead = await XlsxReader.read(file);
      const transparenceCsv = TransparenceCsv.fromFichierXlsx(xlsxRead);

      const readCollection =
        this.transparenceService.readFromCsv(transparenceCsv);

      const transparence = await this.transparenceService.transparence(
        nomTransparence,
        formation,
        dateTransparence,
      )(trx);

      if (!transparence) {
        throw new Error(
          `Transparence not found: ${nomTransparence}, ${formation}, ${JSON.stringify(dateTransparence)}`,
        );
      }

      await this.transparenceService.updateTransparence(
        transparence,
        readCollection,
      )(trx);
    });
  }
}
