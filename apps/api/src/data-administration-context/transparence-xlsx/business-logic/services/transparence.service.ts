import _ from 'lodash';
import { DateOnlyJson, Magistrat } from 'shared-models';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { TransparenceRepository } from '../../../transparences/business-logic/gateways/repositories/transparence.repository';
import { UserService } from '../../../transparences/business-logic/gateways/services/user.service';
import {
  TransparenceXlsxImportéeEvent,
  TransparenceXlsxImportéeEventPayload,
  NominationFilesContentWithReporterIds,
} from '../models/events/transparence-xlsx-importée.event';
import { NominationFileContentReader } from '../models/nomination-file-content-reader';
import { NominationFilesContentReadCollection } from '../models/nomination-files-read-collection';
import { Transparence } from '../models/transparence';
import { TransparenceCsv } from '../models/transparence-csv';

export class TransparenceService {
  constructor(
    private readonly domainEventRepository: DomainEventRepository,
    private readonly transparenceRepository: TransparenceRepository,
    private readonly userService: UserService,
  ) {}

  nouvelleTransparence(
    nomTransparence: string,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
    dateEchéance: DateOnlyJson | null,
    datePriseDePosteCible: DateOnlyJson | null,
    dateClôtureDélaiObservation: DateOnlyJson,
    readCollection: NominationFilesContentReadCollection,
  ): TransactionableAsync<Transparence> {
    return async (trx) => {
      const nominationFiles = readCollection.toModels();
      const transparence = Transparence.nouvelle(
        nomTransparence,
        formation,
        dateTransparence,
        dateEchéance,
        datePriseDePosteCible,
        dateClôtureDélaiObservation,
        nominationFiles,
      );
      await this.transparenceRepository.save(transparence)(trx);

      const payload: TransparenceXlsxImportéeEventPayload = {
        transparenceId: transparence.id,
        transparenceName: transparence.name,
        formation,
        dateEchéance,
        dateTransparence,
        dateClôtureDélaiObservation,
        nominationFiles: await this.nominationFilesWithReportersIds(
          readCollection,
          transparence,
        ),
      };
      const newTransparenceImportedEvent =
        TransparenceXlsxImportéeEvent.create(payload);
      await this.domainEventRepository.save(newTransparenceImportedEvent)(trx);

      return transparence;
    };
  }

  updateTransparence(
    transparence: Transparence,
    readCollection: NominationFilesContentReadCollection,
  ): TransactionableAsync {
    return async (trx) => {
      const transparenceXlsxObservantsImportésEvent =
        transparence.updateObservants(readCollection);

      await this.transparenceRepository.save(transparence)(trx);
      await this.domainEventRepository.save(
        transparenceXlsxObservantsImportésEvent,
      )(trx);
    };
  }

  readFromCsv(
    transparenceCsv: TransparenceCsv,
  ): NominationFilesContentReadCollection {
    const nominationFileReadCollection = new NominationFileContentReader(
      transparenceCsv.getHeader(),
      transparenceCsv.getLignes(),
    ).read();

    return nominationFileReadCollection;
  }

  transparence(
    nom: string,
    formation: Magistrat.Formation,
  ): TransactionableAsync<Transparence | null> {
    return async (trx) =>
      await this.transparenceRepository.transparence(nom, formation)(trx);
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
