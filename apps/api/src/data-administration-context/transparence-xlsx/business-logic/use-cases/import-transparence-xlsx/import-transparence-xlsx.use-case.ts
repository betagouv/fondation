import { Magistrat } from 'shared-models';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { TransparenceCsv } from '../../models/transparence-csv';
import { XlsxReader } from '../../models/xlsx-reader';
import { TransparenceService } from '../../services/transparence.service';

export class ImportTransparenceXlsxUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceService: TransparenceService,
  ) {}

  async execute(
    file: File,
    formation: Magistrat.Formation,
    nomTransparence: string,
  ): Promise<void> {
    await this.transactionPerformer.perform(async (trx) => {
      const xlsxRead = await XlsxReader.read(file);
      const transparenceCsv = TransparenceCsv.fromFichierXlsx(xlsxRead);

      const readCollection =
        this.transparenceService.readFromCsv(transparenceCsv);

      await this.transparenceService.nouvelleTransparence(
        nomTransparence,
        formation,
        readCollection,
      )(trx);
    });
  }
}
