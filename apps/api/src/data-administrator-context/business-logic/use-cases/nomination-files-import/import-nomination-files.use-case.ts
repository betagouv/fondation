import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domainEventRepository';
import { NominationFileRepository } from '../../gateways/repositories/nomination-file-repository';
import { NominationFileContentReader } from '../../models/nomination-file-content-reader';
import { TsvParser } from '../../models/tsv-parser';
import { NominationFileModel } from '../../models/nomination-file';

export class ImportNominationFilesUseCase {
  constructor(
    private readonly nominationFileRepository: NominationFileRepository,
    private readonly dateTimeProvider: DateTimeProvider,
    private readonly uuidGenerator: UuidGenerator,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly domainEventRepository: DomainEventRepository,
  ) {}
  async execute(fileContentToImport: string): Promise<void> {
    const parsedContent = new TsvParser().parse(fileContentToImport);
    const [, secondHeader, ...content] = parsedContent;

    const [contentRead, nominationFilesImportedEvent] =
      new NominationFileContentReader(secondHeader, content).read(
        this.uuidGenerator.generate(),
        this.dateTimeProvider.now(),
      );

    return this.transactionPerformer.perform(async (trx) => {
      const promises = contentRead.map((content) =>
        this.nominationFileRepository.save(
          new NominationFileModel(this.uuidGenerator.generate(), null, content),
        )(trx),
      );
      await Promise.all(promises);

      await this.domainEventRepository.save(nominationFilesImportedEvent)(trx);
      console.log('use case: event emitted:', nominationFilesImportedEvent);
    });
  }
}
