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
      // await this.domainEventPublisher.publish(
      //   NouvelleTransparenceXlsxImportedEvent.create({
      //     transparenceId: transparenceCsv.id,
      //     filename: file.name,
      //     data: xlsxRead.getData(),
      //   }),
      // );

      const readCollection = this.transparenceService.readFromTsvFile(
        transparenceCsv.getTsv(),
      );

      await this.transparenceService.nouvelleTransparence(
        nomTransparence,
        formation,
        readCollection,
      )(trx);
    });
  }
}
