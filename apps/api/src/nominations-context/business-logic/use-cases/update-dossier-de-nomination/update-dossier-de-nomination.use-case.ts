import {
  TransactionableAsync,
  TransactionPerformer,
} from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DossierDeNominationRepository } from '../../gateways/repositories/dossier-de-nomination.repository';
import { PréAnalyseRepository } from '../../gateways/repositories/pré-analyse.repository';
import {
  DossierDeNomination,
  DossierDeNominationTransparence,
} from '../../models/dossier-de-nomination';
import { DossierDeNominationSaisineInferer } from '../../models/dossier-de-nomination-saisine-inferer';
import { GdsDossierTransparenceModifiéEventRulesTransformer } from '../../models/gds-dossier-transparence-modifié-event-rules-transformer';
import { UpdateDossierDeNominationCommand } from './update-dossier-de-nomination.command';

export class UpdateDossierDeNominationUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly dossierDeNominationRepository: DossierDeNominationRepository,
    private readonly préAnalyseRepository: PréAnalyseRepository,
  ) {}

  async execute(command: UpdateDossierDeNominationCommand): Promise<void> {
    await this.transactionPerformer.perform(async (trx) => {
      for (const nominationFile of command.nominationFiles) {
        const { content, nominationFileId: nominationFileImportedId } =
          nominationFile;

        const dossier = await this.dossierDeNomination(
          nominationFileImportedId,
        )(trx);

        const dossierTransparence =
          DossierDeNominationSaisineInferer.parseTransparence(dossier);

        this.mettreàJourNuméroDossier(content, dossierTransparence);
        this.mettreàJourObservants(content, dossierTransparence);
        await this.dossierDeNominationRepository.save(dossier)(trx);

        await this.mettreàJourPréAnalyse(content, dossier)(trx);
      }
    });
  }

  private dossierDeNomination(
    nominationFileImportedId: string,
  ): TransactionableAsync<DossierDeNomination> {
    return async (trx) => {
      const dossier = await this.dossierDeNominationRepository.findById(
        nominationFileImportedId,
      )(trx);
      if (!dossier)
        throw new Error(
          `Dossier non trouvé avec l'import id : ${nominationFileImportedId}`,
        );
      return dossier;
    };
  }

  private mettreàJourPréAnalyse(
    content: UpdateDossierDeNominationCommand['nominationFiles'][number]['content'],
    dossier: DossierDeNomination,
  ): TransactionableAsync {
    return async (trx) => {
      if (content.rules != null) {
        const préAnalyse = await this.préAnalyseRepository.findByDossierId(
          dossier.id,
        )(trx);
        if (!préAnalyse)
          throw new Error(
            `Pré-analyse non trouvée pour le dossier: ${dossier.id}`,
          );

        préAnalyse.mettreàJourRègles(
          GdsDossierTransparenceModifiéEventRulesTransformer.transform(
            content.rules,
          ),
        );
        await this.préAnalyseRepository.save(préAnalyse)(trx);
      }
    };
  }

  private mettreàJourObservants(
    content: UpdateDossierDeNominationCommand['nominationFiles'][number]['content'],
    dossierTransparence: DossierDeNominationTransparence,
  ) {
    if (content.observers != null)
      dossierTransparence.updateObservers(content.observers);
  }

  private mettreàJourNuméroDossier(
    content: UpdateDossierDeNominationCommand['nominationFiles'][number]['content'],
    dossierTransparence: DossierDeNominationTransparence,
  ) {
    if (content.folderNumber != null)
      dossierTransparence.updateFolderNumber(content.folderNumber);
  }
}
