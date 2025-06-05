import { TypeDeSaisine } from 'shared-models';
import { DossierDeNominationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/dossier-de-nomination.repository';
import {
  TransactionableAsync,
  TransactionPerformer,
} from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { PropositionDeNominationTransparence } from '../../models/proposition-de-nomination';
import { UpdateDossierDeNominationCommand } from './update-dossier-de-nomination.command';

export class UpdateDossierDeNominationUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly dossierDeNominationRepository: DossierDeNominationRepository<TypeDeSaisine.TRANSPARENCE_GDS>,
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

  private mettreàJourObservants(
    content: UpdateDossierDeNominationCommand['nominationFiles'][number]['content'],
    proposition: PropositionDeNominationTransparence,
  ) {
    if (content.observers != null)
      proposition.updateObservers({
        version: 1,
        observers: content.observers,
      });
  }

  private mettreàJourNuméroDossier(
    content: UpdateDossierDeNominationCommand['nominationFiles'][number]['content'],
    proposition: PropositionDeNominationTransparence,
  ) {
    if (content.folderNumber != null)
      proposition.updateFolderNumber({
        version: 1,
        folderNumber: content.folderNumber,
      });
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
