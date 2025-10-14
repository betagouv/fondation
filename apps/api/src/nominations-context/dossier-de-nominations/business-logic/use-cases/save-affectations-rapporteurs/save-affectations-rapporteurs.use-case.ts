import { SaveAffectationsRapporteursNestDto } from 'src/nominations-context/dossier-de-nominations/adapters/primary/nestjs/dto/save-affectations-rapporteurs.nest-dto';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import { SessionRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/session.repository';
import { HandleAffectationUpdatedUseCase } from 'src/reports-context/business-logic/use-cases/handle-affectation-modifiée/handle-affectation-updated.use-case';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class SaveAffectationsRapporteursUseCase {
  constructor(
    private readonly affectationRepository: AffectationRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly handleAffectationUpdatedUseCase: HandleAffectationUpdatedUseCase,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(dto: SaveAffectationsRapporteursNestDto): Promise<void> {
    const { sessionId, affectations } = dto;

    return this.transactionPerformer.perform(async (trx) => {
      const session = await this.sessionRepository.session(sessionId)(trx);

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

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

      const affectationSnapshot = affectationGlobale.snapshot();
      await this.handleAffectationUpdatedUseCase.execute({
        id: affectationSnapshot.id,
        sessionId: affectationSnapshot.sessionId,
        typeDeSaisine: session.typeDeSaisine,
        formation: affectationSnapshot.formation,
        affectationsDossiersDeNominations:
          affectationSnapshot.affectationsDossiersDeNominations,
      })(trx);
    });
  }
}
