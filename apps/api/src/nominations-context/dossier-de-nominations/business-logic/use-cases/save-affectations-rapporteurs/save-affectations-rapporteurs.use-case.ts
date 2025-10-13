import { SaveAffectationsRapporteursNestDto } from 'src/nominations-context/dossier-de-nominations/adapters/primary/nestjs/dto/save-affectations-rapporteurs.nest-dto';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class SaveAffectationsRapporteursUseCase {
  constructor(
    private readonly affectationRepository: AffectationRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(dto: SaveAffectationsRapporteursNestDto): Promise<void> {
    const { sessionId, affectations } = dto;

    return this.transactionPerformer.perform(async (trx) => {
      const affectationGlobale =
        await this.affectationRepository.bySessionId(sessionId)(trx);

      if (!affectationGlobale) {
        throw new Error(`Affectation for session ${sessionId} not found`);
      }

      const affectationsDossiersDeNominations = affectations.map(
        ({ dossierId, rapporteurIds }) => ({
          dossierDeNominationId: dossierId,
          rapporteurIds,
        }),
      );

      affectationGlobale.mettreAJourAffectations(
        affectationsDossiersDeNominations,
      );

      await this.affectationRepository.save(affectationGlobale)(trx);
    });
  }
}
