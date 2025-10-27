import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import { SessionRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/session.repository';
import { HandleAffectationUpdatedUseCase } from 'src/reports-context/business-logic/use-cases/handle-affectation-modifiée/handle-affectation-updated.use-case';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class PublierAffectationsUseCase {
  constructor(
    private readonly affectationRepository: AffectationRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly handleAffectationUpdatedUseCase: HandleAffectationUpdatedUseCase,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(sessionId: string, auteurId: string): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const session = await this.sessionRepository.session(sessionId)(trx);

      if (!session) {
        throw new Error(`Session ${sessionId} introuvable`);
      }

      // Récupérer la version brouillon
      const affectationBrouillon =
        await this.affectationRepository.versionBrouillon(sessionId)(trx);

      if (!affectationBrouillon) {
        throw new Error(
          `Aucune version brouillon à publier pour la session ${sessionId}`,
        );
      }

      // Publier le brouillon
      affectationBrouillon.publier(auteurId);
      await this.affectationRepository.save(affectationBrouillon)(trx);

      // Créer/mettre à jour les rapports
      const affectationSnapshot = affectationBrouillon.snapshot();
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
