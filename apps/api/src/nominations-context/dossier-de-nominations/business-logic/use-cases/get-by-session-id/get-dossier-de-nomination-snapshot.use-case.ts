import { DossierDeNominationEtAffectationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import { DossierDeNomination } from 'src/reports-context/business-logic/models/dossier-de-nomination';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserService } from 'src/shared-kernel/business-logic/gateways/services/user.service';
import { DossierDeNominationRepository } from '../../gateways/repositories/dossier-de-nomination.repository';

export class GetBySessionIdUseCase {
  constructor(
    private readonly dossierDeNominationRepository: DossierDeNominationRepository,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly affectationRepository: AffectationRepository,
    private readonly httpUserService: UserService,
  ) {}

  async execute(
    sessionId: string,
  ): Promise<DossierDeNominationEtAffectationSnapshot[]> {
    return this.transactionPerformer.perform(async (trx) => {
      const dossiers =
        await this.dossierDeNominationRepository.findBySessionId(sessionId)(
          trx,
        );

      const affectation = (
        await this.affectationRepository.bySessionId(sessionId)(trx)
      )?.snapshot();

      const rapporteurs: Record<
        DossierDeNomination['_dossierDeNominationId'],
        string[]
      > = {};
      dossiers.forEach((dossier) => {
        rapporteurs[dossier.id] = [];
      });

      if (affectation) {
        const { affectationsDossiersDeNominations } = affectation;

        const rapporteurPromises = affectationsDossiersDeNominations.flatMap(
          (affectation) => {
            const { rapporteurIds, dossierDeNominationId } = affectation;
            return rapporteurIds.map(async (rapporteurId) => {
              const rapporteur =
                await this.httpUserService.userWithId(rapporteurId);
              return {
                dossierDeNominationId,
                nom: `${rapporteur.lastName} ${rapporteur.firstName}`,
              };
            });
          },
        );

        const rapporteurResults = await Promise.all(rapporteurPromises);

        rapporteurResults.forEach(({ dossierDeNominationId, nom }) => {
          rapporteurs[dossierDeNominationId]?.push(nom);
        });
      }

      return (dossiers || []).map((dossier) => ({
        ...dossier.snapshot(),
        rapporteurs: rapporteurs[dossier.id] || [],
      }));
    });
  }
}
