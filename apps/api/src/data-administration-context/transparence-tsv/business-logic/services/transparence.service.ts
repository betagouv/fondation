import _ from 'lodash';
import { DateOnlyJson, Magistrat, Transparency } from 'shared-models';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { TransparenceRepository } from '../../../transparences/business-logic/gateways/repositories/transparence.repository';
import { UserService } from '../../../transparences/business-logic/gateways/services/user.service';
import {
  GdsNewTransparenceImportedEvent,
  GdsNewTransparenceImportedEventPayload,
  NominationFilesContentWithReporterIds,
} from '../models/events/gds-transparence-imported.event';
import { NominationFileContentReader } from '../models/nomination-file-content-reader';
import {
  NominationFilesContentReadCollection,
  TransparenceCollection,
} from '../models/nomination-files-read-collection';
import { Transparence } from '../models/transparence';
import { TsvParser } from '../models/tsv-parser';
import {
  GdsTransparenceNominationFilesAddedEventPayload,
  GdsTransparenceNominationFilesAddedEvent,
} from '../models/events/gds-transparence-nomination-files-added.event';

export class TransparenceService {
  constructor(
    private readonly domainEventRepository: DomainEventRepository,
    private readonly transparenceRepository: TransparenceRepository,
    private readonly userService: UserService,
  ) {}

  nouvelleTransparence(
    transparency: Transparency,
    formation: Magistrat.Formation,
    readCollection: NominationFilesContentReadCollection,
  ): TransactionableAsync<Transparence> {
    return async (trx) => {
      const nominationFiles = readCollection.toModels();
      const transparence = Transparence.nouvelle(
        transparency,
        formation,
        nominationFiles,
      );

      await this.transparenceRepository.save(transparence)(trx);

      const payload: GdsNewTransparenceImportedEventPayload = {
        transparenceId: transparence.id,
        transparenceName: transparence.name,
        formation,
        nominationFiles: await this.nominationFilesWithReportersIds(
          readCollection,
          transparence,
        ),
      };
      const newTransparenceImportedEvent =
        GdsNewTransparenceImportedEvent.create(payload);
      await this.domainEventRepository.save(newTransparenceImportedEvent)(trx);

      return transparence;
    };
  }

  updateTransparence(
    transparence: Transparence,
    readCollection: NominationFilesContentReadCollection,
  ): TransactionableAsync {
    return async (trx) => {
      const nominationFilesToAdd =
        transparence.addNewNominationFiles(readCollection);
      const modifiedNominationFilesEvent =
        transparence.replaceModifiedNominationFiles(readCollection);

      // TODO: Manque d'expressivité, le save est déclenché lors de l'ajout
      // OU de la modification d'une transparence
      await this.transparenceRepository.save(transparence)(trx);

      if (nominationFilesToAdd) {
        const payload: GdsTransparenceNominationFilesAddedEventPayload = {
          transparenceId: transparence.id,
          transparenceName: transparence.name,
          nominationFiles: await this.nominationFilesWithReportersIds(
            nominationFilesToAdd,
            transparence,
          ),
        };
        const nominationFilesAddedEvent =
          GdsTransparenceNominationFilesAddedEvent.create(payload);

        await this.domainEventRepository.save(nominationFilesAddedEvent)(trx);
      }

      if (modifiedNominationFilesEvent) {
        await this.domainEventRepository.save(modifiedNominationFilesEvent)(
          trx,
        );
      }
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
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
  ): TransactionableAsync<Transparence | null> {
    return async (trx) =>
      (await this.transparenceRepository.transparence(
        transparence,
        formation,
        dateTransparence,
      )(trx)) as unknown as Transparence;
  }

  private async nominationFilesWithReportersIds(
    nominationFiles: NominationFilesContentReadCollection,
    transparence: Transparence,
  ): Promise<NominationFilesContentWithReporterIds[]> {
    const reporterNames: string[] = _.uniq(
      nominationFiles
        .contents()
        .flatMap((nominationFile) => nominationFile.reporters)
        .filter((reporterName): reporterName is string => !!reporterName),
    );
    const reportersList = await Promise.all(
      reporterNames.map(async (reporterName) => {
        return [
          reporterName,
          await this.userService.userWithFullName(reporterName!)!,
        ] as const;
      }),
    );

    const reporters = Object.fromEntries(reportersList);

    return transparence.nominationFilesEventPayload(nominationFiles, reporters);
  }
}
