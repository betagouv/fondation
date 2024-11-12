import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domainEventRepository';
import { NominationFileRepository } from '../../gateways/repositories/nomination-file-repository';
import { NominationFileContentReader } from '../../models/nomination-file-content-reader';
import { TsvParser } from '../../models/tsv-parser';
import { NominationFilesUpdatedCollection } from '../../models/nomination-files-updated-collection';

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

    const readCollection = new NominationFileContentReader(
      secondHeader,
      content,
    ).read();

    return this.transactionPerformer.perform(async (trx) => {
      const existingNominationFiles =
        await this.nominationFileRepository.findAll()(trx);

      const [newNominationFiles, newNominationFilesImportedEvent] =
        readCollection
          .excludeExistingNominationFiles(existingNominationFiles)
          .toModelsWithEvent(
            () => this.uuidGenerator.generate(),
            this.dateTimeProvider.now(),
          );

      const promises = newNominationFiles.map((nominationFile) =>
        this.nominationFileRepository.save(nominationFile)(trx),
      );
      await Promise.all(promises);

      if (newNominationFilesImportedEvent)
        await this.domainEventRepository.save(newNominationFilesImportedEvent)(
          trx,
        );

      const [updatedNominationFiles, nominationFilesUpdatedEvent] =
        new NominationFilesUpdatedCollection(
          existingNominationFiles,
        ).updateNominationFiles(
          readCollection.getNominationFilesRead(),
          this.uuidGenerator.generate(),
          this.dateTimeProvider.now(),
        );

      if (!nominationFilesUpdatedEvent) return;
      for (const nominationFile of updatedNominationFiles) {
        await this.nominationFileRepository.save(nominationFile)(trx);
      }
      await this.domainEventRepository.save(nominationFilesUpdatedEvent)(trx);
    });
  }
}
