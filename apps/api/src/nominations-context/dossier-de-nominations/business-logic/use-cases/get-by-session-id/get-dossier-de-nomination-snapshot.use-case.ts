import {
  DossiersEtAffectationResponse,
  AffectationMetadata,
} from 'shared-models/models/session/dossier-de-nomination';
import { PrioriteEnum } from 'shared-models/models/priorite.enum';
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
  ): Promise<DossiersEtAffectationResponse> {
    const { sessionId } = params;
    return this.transactionPerformer.perform(async (trx) => {
      const [dossiers, affectation] = await Promise.all([
        this.dossierDeNominationRepository.findBySessionId(sessionId)(trx),
        this.affectationRepository.bySessionId(sessionId)(trx),
      ]);

      const rapporteursParDossier =
        await this.buildRapporteursParDossier(affectation);
      const prioritesParDossier = this.buildPrioritesParDossier(affectation);

      const dossiersSnapshots = (dossiers || []).map((dossier) => ({
        ...dossier.snapshot(),
        rapporteurs: rapporteursParDossier[dossier.id] || [],
        priorite: prioritesParDossier[dossier.id],
      }));

      const metadata: AffectationMetadata | null = affectation
        ? {
            statut: affectation.statut,
            version: affectation.version,
            datePublication: affectation.snapshot().datePublication,
            auteurPublication: affectation.snapshot().auteurPublication,
          }
        : null;

      return {
        dossiers: dossiersSnapshots,
        metadata,
      };
    });
  }

  private async buildRapporteursParDossier(
    affectation: Awaited<
      ReturnType<ReturnType<AffectationRepository['bySessionId']>>
    > | null,
  ): Promise<Record<string, Array<{ userId: string; nom: string }>>> {
    if (!affectation) return {};

    const snapshot = affectation.snapshot();
    const uniqueRapporteurIds = [
      ...new Set(
        snapshot.affectationsDossiersDeNominations.flatMap(
          (a) => a.rapporteurIds,
        ),
      ),
    ];

    const rapporteurs = await Promise.all(
      uniqueRapporteurIds.map((id) => this.httpUserService.userWithId(id)),
    );

    const rapporteursById = new Map(
      rapporteurs.map((r) => [
        r.userId,
        { userId: r.userId, nom: `${r.lastName} ${r.firstName}` },
      ]),
    );

    const rapporteursParDossier: Record<
      string,
      Array<{ userId: string; nom: string }>
    > = {};
    snapshot.affectationsDossiersDeNominations.forEach(
      ({ dossierDeNominationId, rapporteurIds }) => {
        rapporteursParDossier[dossierDeNominationId] = rapporteurIds
          .map((id) => rapporteursById.get(id))
          .filter(
            (rapporteur): rapporteur is { userId: string; nom: string } =>
              rapporteur !== undefined,
          );
      },
    );

    return rapporteursParDossier;
  }

  private buildPrioritesParDossier(
    affectation: Awaited<
      ReturnType<ReturnType<AffectationRepository['bySessionId']>>
    > | null,
  ): Record<string, PrioriteEnum | undefined> {
    if (!affectation) return {};

    const snapshot = affectation.snapshot();
    const prioritesParDossier: Record<string, PrioriteEnum | undefined> = {};

    snapshot.affectationsDossiersDeNominations.forEach(
      ({ dossierDeNominationId, priorite }) => {
        prioritesParDossier[dossierDeNominationId] = priorite;
      },
    );

    return prioritesParDossier;
  }
}
