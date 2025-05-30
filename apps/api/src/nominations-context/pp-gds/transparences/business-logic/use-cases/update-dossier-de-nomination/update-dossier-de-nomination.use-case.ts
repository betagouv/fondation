import { TypeDeSaisine } from 'shared-models';
import { DossierDeNominationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/dossier-de-nomination.repository';
import { PréAnalyseRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/pré-analyse.repository';
import { DossierDeNomination } from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';
import {
  TransactionableAsync,
  TransactionPerformer,
} from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { GdsDossierTransparenceModifiéEventRulesTransformer } from '../../models/gds-dossier-transparence-modifié-event-rules-transformer';
import { PropositionDeNominationTransparence } from '../../models/proposition-de-nomination';
import { UpdateDossierDeNominationCommand } from './update-dossier-de-nomination.command';

export class UpdateDossierDeNominationUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly dossierDeNominationRepository: DossierDeNominationRepository<TypeDeSaisine.TRANSPARENCE_GDS>,
    private readonly préAnalyseRepository: PréAnalyseRepository,
  ) {}

  async execute(command: UpdateDossierDeNominationCommand): Promise<void> {
    await this.transactionPerformer.perform(async (trx) => {
      for (const nominationFile of command.nominationFiles) {
        const { content, nominationFileId: nominationFileImportedId } =
          nominationFile;

        const propositionDeNomination = await this.propositionDeNomination(
          nominationFileImportedId,
        )(trx);

        this.mettreàJourNuméroDossier(content, propositionDeNomination);
        this.mettreàJourObservants(content, propositionDeNomination);
        this.mettreàJourDatePassageAuGrade(content, propositionDeNomination);
        this.mettreàJourDatePriseDeFonctionPosteActuel(
          content,
          propositionDeNomination,
        );
        this.mettreàJourInformationCarrière(content, propositionDeNomination);
        await this.dossierDeNominationRepository.save(propositionDeNomination)(
          trx,
        );

        await this.mettreàJourPréAnalyse(content, propositionDeNomination)(trx);
      }
    });
  }

  private propositionDeNomination(
    nominationFileImportedId: string,
  ): TransactionableAsync<PropositionDeNominationTransparence> {
    return async (trx) => {
      const dossier = await this.dossierDeNominationRepository.findByImportedId(
        nominationFileImportedId,
      )(trx);
      if (!dossier)
        throw new Error(
          `Dossier non trouvé avec l'import id : ${nominationFileImportedId}`,
        );

      const dossierTransparence =
        PropositionDeNominationTransparence.fromDossierDeNomination(dossier);
      return dossierTransparence;
    };
  }

  private mettreàJourPréAnalyse(
    content: UpdateDossierDeNominationCommand['nominationFiles'][number]['content'],
    dossier: DossierDeNomination<TypeDeSaisine.TRANSPARENCE_GDS>,
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
    proposition: PropositionDeNominationTransparence,
  ) {
    if (content.observers != null)
      proposition.updateObservers(content.observers);
  }

  private mettreàJourNuméroDossier(
    content: UpdateDossierDeNominationCommand['nominationFiles'][number]['content'],
    proposition: PropositionDeNominationTransparence,
  ) {
    if (content.folderNumber != null)
      proposition.updateFolderNumber(content.folderNumber);
  }

  private mettreàJourDatePassageAuGrade(
    content: UpdateDossierDeNominationCommand['nominationFiles'][number]['content'],
    proposition: PropositionDeNominationTransparence,
  ) {
    if (content.datePassageAuGrade !== undefined)
      proposition.updateDatePassageAuGrade(content.datePassageAuGrade);
  }

  private mettreàJourDatePriseDeFonctionPosteActuel(
    content: UpdateDossierDeNominationCommand['nominationFiles'][number]['content'],
    proposition: PropositionDeNominationTransparence,
  ) {
    if (content.datePriseDeFonctionPosteActuel !== undefined)
      proposition.updateDatePriseDeFonctionPosteActuel(
        content.datePriseDeFonctionPosteActuel,
      );
  }

  private mettreàJourInformationCarrière(
    content: UpdateDossierDeNominationCommand['nominationFiles'][number]['content'],
    proposition: PropositionDeNominationTransparence,
  ) {
    if (content.informationCarrière !== undefined)
      proposition.updateInformationCarrière(content.informationCarrière);
  }
}
