import { DossierDeNominationEtAffectationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
import { DossierDeNominationEtAffectationParamsNestDto } from 'src/nominations-context/dossier-de-nominations/adapters/primary/nestjs/dto/dossier-de-nomination-et-affectation.nest-dto';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
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
    params: DossierDeNominationEtAffectationParamsNestDto,
  ): Promise<{
    dossiers: DossierDeNominationEtAffectationSnapshot[];
    availableRapporteurs: UserDescriptorSerialized[];
  }> {
    const { sessionId, formation } = params;
    return this.transactionPerformer.perform(async (trx) => {
      const [dossiers, affectation] = await Promise.all([
        this.dossierDeNominationRepository.findBySessionId(sessionId)(trx),
        this.affectationRepository.bySessionId(sessionId)(trx),
      ]);

      const rapporteursParDossier =
        await this.buildRapporteursParDossier(affectation);

      const dossiersWithRapporteurs = (dossiers || []).map((dossier) => ({
        ...dossier.snapshot(),
        rapporteurs: rapporteursParDossier[dossier.id] || [],
      }));

      const availableRapporteurs = formation
        ? await this.httpUserService.usersByFormation(formation)
        : [];

      return {
        dossiers: dossiersWithRapporteurs,
        availableRapporteurs,
      };
    });
  }

  private async buildRapporteursParDossier(
    affectation: Awaited<
      ReturnType<ReturnType<AffectationRepository['bySessionId']>>
    > | null,
  ): Promise<Record<string, string[]>> {
    if (!affectation) return {};

    const snapshot = affectation.snapshot();
    const uniqueRapporteurIds = [
      ...new Set(
        snapshot.affectationsDossiersDeNominations.flatMap(
          (a) => a.rapporteurIds,
        ),
      ),
    ];

    // Batch fetch all rapporteurs in one call (avoid N+1)
    const rapporteurs = await Promise.all(
      uniqueRapporteurIds.map((id) => this.httpUserService.userWithId(id)),
    );

    const rapporteursById = new Map(
      rapporteurs.map((r) => [r.userId, `${r.lastName} ${r.firstName}`]),
    );

    // Build the mapping
    const rapporteursParDossier: Record<string, string[]> = {};
    snapshot.affectationsDossiersDeNominations.forEach(
      ({ dossierDeNominationId, rapporteurIds }) => {
        rapporteursParDossier[dossierDeNominationId] = rapporteurIds
          .map((id) => rapporteursById.get(id))
          .filter((nom): nom is string => nom !== undefined);
      },
    );

    return rapporteursParDossier;
  }
}
