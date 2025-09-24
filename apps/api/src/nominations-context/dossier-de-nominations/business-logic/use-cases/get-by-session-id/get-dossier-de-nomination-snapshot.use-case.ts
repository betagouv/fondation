import { Magistrat } from 'shared-models';
import { DossierDeNominationEtAffectationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
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
    formation: Magistrat.Formation,
  ): Promise<{
    dossiers: DossierDeNominationEtAffectationSnapshot[];
    availableRapporteurs: UserDescriptorSerialized[];
  }> {
    return this.transactionPerformer.perform(async (trx) => {
      const dossiers =
        await this.dossierDeNominationRepository.findBySessionId(sessionId)(
          trx,
        );

      const affectation = (
        await this.affectationRepository.bySessionId(sessionId)(trx)
      )?.snapshot();

      const rapporteursParDossier: Record<
        DossierDeNomination['_dossierDeNominationId'],
        string[]
      > = {};
      dossiers.forEach((dossier) => {
        rapporteursParDossier[dossier.id] = [];
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
          rapporteursParDossier[dossierDeNominationId]?.push(nom);
        });
      }

      const availableRapporteurs =
        await this.httpUserService.usersByFormation(formation);

      return {
        dossiers: (dossiers || []).map((dossier) => ({
          ...dossier.snapshot(),
          rapporteurs: rapporteursParDossier[dossier.id] || [],
        })),
        availableRapporteurs,
      };
    });
  }
}
