import { NouvelleTransparenceXlsxImportedEvent } from 'src/data-administration-context/business-logic/models/events/nouvelle-transparence-xlsx-imported.event';
import { DomainEventPublisher } from 'src/shared-kernel/business-logic/gateways/providers/domain-event-publisher';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { TransparenceCsvRepository } from '../../gateways/repositories/transparence-csv.repository';
import { TransparenceCsv } from '../../models/transparence-csv';
import { XlsxReader } from '../../models/xlsx-reader';

export class ImportTransparenceXlsxUseCase {
  constructor(
    private readonly transparenceCsvRepository: TransparenceCsvRepository,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  async execute(file: File): Promise<void> {
    await this.transactionPerformer.perform(async (trx) => {
      const xlsxRead = await XlsxReader.read(file);
      const transparenceCsv = TransparenceCsv.fromFichierXlsx(xlsxRead);
      await this.transparenceCsvRepository.enregistrerCsv(transparenceCsv)(trx);
      await this.domainEventPublisher.publish(
        NouvelleTransparenceXlsxImportedEvent.create({
          transparenceId: transparenceCsv.id,
          filename: file.name,
          data: xlsxRead.getData(),
        }),
      );
    });
  }
}
