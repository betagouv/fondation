import { Transparency } from 'shared-models';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { NominationFileRepository } from '../../gateways/repositories/nomination-file-repository';
import { NominationFileContentReader } from '../../models/nomination-file-content-reader';
import { NominationFilesUpdatedCollection } from '../../models/nomination-files-updated-collection';
import { TsvParser } from '../../models/tsv-parser';
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

    const nominationFileReadCollection = new NominationFileContentReader(
      secondHeader,
      content,
    ).read();

    const perTransparence = nominationFileReadCollection.perTransparence();

    return this.transactionPerformer.perform(async (trx) => {
      for (const { readCollection, transparency } of perTransparence) {
        const existingNominationFiles =
          await this.nominationFileRepository.findSnapshotsPerTransparency(
            transparency as Transparency,
          )(trx);

        const newNominationFilesCollection = readCollection.newNominationFiles(
          existingNominationFiles,
        );

        const [newNominationFilesModels, newNominationFilesImportedEvent] =
          newNominationFilesCollection.toModelsWithEvent(
            () => this.uuidGenerator.generate(),
            this.dateTimeProvider.now(),
          );

        for (const nominationFile of newNominationFilesModels) {
          await this.nominationFileRepository.save(nominationFile)(trx);
        }

        if (newNominationFilesImportedEvent)
          await this.domainEventRepository.save(
            newNominationFilesImportedEvent,
          )(trx);

        const updatedNominationFilesFields =
          readCollection.updatedNominationFiles(existingNominationFiles);
        const [updatedNominationFiles, nominationFilesUpdatedEvent] =
          new NominationFilesUpdatedCollection(
            existingNominationFiles,
          ).updateNominationFiles(
            updatedNominationFilesFields,
            this.uuidGenerator.generate(),
            this.dateTimeProvider.now(),
          );

        if (!nominationFilesUpdatedEvent) continue;
        for (const nominationFile of updatedNominationFiles) {
          await this.nominationFileRepository.save(nominationFile)(trx);
        }
        await this.domainEventRepository.save(nominationFilesUpdatedEvent)(trx);
      }
    });
  }
}
