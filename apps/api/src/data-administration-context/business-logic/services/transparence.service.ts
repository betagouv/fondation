import { Magistrat, Transparency } from 'shared-models';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { NominationFileRepository } from '../gateways/repositories/nomination-file-repository';
import { NominationFileModelSnapshot } from '../models/nomination-file';
import { NominationFileContentReader } from '../models/nomination-file-content-reader';
import {
  NominationFilesContentReadCollection,
  TransparenceCollection,
} from '../models/nomination-files-read-collection';
import { NominationFilesUpdatedCollection } from '../models/nomination-files-updated-collection';
import { TsvParser } from '../models/tsv-parser';
import { TransparenceRepository } from '../gateways/repositories/transparence.repository';
import { Transparence } from '../models/transparence';
import {
  GdsNewTransparenceImportedEvent,
  GdsNewTransparenceImportedEventPayload,
} from '../models/events/gds-transparence-imported.event';

export class TransparenceService {
  constructor(
    private readonly nominationFileRepository: NominationFileRepository,
    private readonly domainEventRepository: DomainEventRepository,
    private readonly transparenceRepository: TransparenceRepository,
  ) {}

  nouvelleTransparence(
    transparency: Transparency,
    readCollection: NominationFilesContentReadCollection,
  ): TransactionableAsync {
    return async (trx) => {
      const nominationFiles = readCollection.toModels();
      const transparence = Transparence.nouvelle(
        transparency,
        readCollection.formations(),
        nominationFiles,
      );

      await this.transparenceRepository.save(transparence)(trx);

      const payload: GdsNewTransparenceImportedEventPayload = {
        transparenceId: transparency,
        formations: readCollection.formations(),
        nominationFiles: readCollection.contents(),
      };
      const newTransparenceImportedEvent =
        GdsNewTransparenceImportedEvent.create(payload);
      await this.domainEventRepository.save(newTransparenceImportedEvent)(trx);
      console.log('Nouvelle transparence', transparency);
    };
  }

  readFromTsvFile(fileContentToImport: string): TransparenceCollection[] {
    const parsedContent = new TsvParser().parse(fileContentToImport);
    const [, secondHeader, ...content] = parsedContent;

    const nominationFileReadCollection = new NominationFileContentReader(
      secondHeader,
      content,
    ).read();

    return nominationFileReadCollection.perTransparence();
  }

  transparence(
    transparence: Transparency,
  ): TransactionableAsync<Transparence | null> {
    return async (trx) =>
      await this.transparenceRepository.transparence(transparence)(trx);
  }

  nominationFilesSnapshots(
    transparence: Transparency,
  ): TransactionableAsync<NominationFileModelSnapshot[]> {
    return async (trx) =>
      await this.nominationFileRepository.findSnapshotsPerTransparency(
        transparence,
      )(trx);
  }

  createNewNominationFiles(
    readCollection: NominationFilesContentReadCollection,
    existingNominationFiles: NominationFileModelSnapshot[],
  ): TransactionableAsync {
    return async (trx) => {
      const newNominationFilesCollection = readCollection.newNominationFiles(
        existingNominationFiles,
      );

      const [newNominationFilesModels, newNominationFilesImportedEvent] =
        newNominationFilesCollection.toModelsWithEvent();

      for (const nominationFile of newNominationFilesModels) {
        await this.nominationFileRepository.save(nominationFile)(trx);
      }

      if (newNominationFilesImportedEvent)
        await this.domainEventRepository.save(newNominationFilesImportedEvent)(
          trx,
        );
    };
  }

  updateModifiedNominationFiles(
    readCollection: NominationFilesContentReadCollection,
    existingNominationFiles: NominationFileModelSnapshot[],
  ): TransactionableAsync {
    return async (trx) => {
      const updatedNominationFilesFields =
        readCollection.updatedNominationFiles(existingNominationFiles);

      const [updatedNominationFiles, nominationFilesUpdatedEvent] =
        new NominationFilesUpdatedCollection(
          existingNominationFiles,
        ).updateNominationFiles(updatedNominationFilesFields);

      if (!nominationFilesUpdatedEvent) return;

      for (const nominationFile of updatedNominationFiles) {
        await this.nominationFileRepository.save(nominationFile)(trx);
      }
      await this.domainEventRepository.save(nominationFilesUpdatedEvent)(trx);
    };
  }
}
