import { TypeDeSaisine } from 'shared-models';
import {
  TransactionableAsync,
  TransactionPerformer,
} from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { PropositionDeNominationTransparence } from '../../models/proposition-de-nomination';
import { UpdateObservantsCommand } from './update-observants.command';
import { DossierDeNominationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/dossier-de-nomination.repository';

export class UpdateObservantsUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly dossierDeNominationRepository: DossierDeNominationRepository<TypeDeSaisine.TRANSPARENCE_GDS>,
  ) {}

  async execute(command: UpdateObservantsCommand): Promise<void> {
    await this.transactionPerformer.perform(async (trx) => {
      for (const dossier of command.dossiersDeNominations) {
        const { dossierId, observants } = dossier;
        const propositionDeNomination =
          await this.propositionDeNomination(dossierId)(trx);

        this.mettreàJourObservants(observants, propositionDeNomination);

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
    observants: UpdateObservantsCommand['dossiersDeNominations'][number]['observants'],
    proposition: PropositionDeNominationTransparence,
  ) {
    if (observants != null)
      proposition.updateObservers({
        version: 2,
        observants,
      });
  }
}
