import { SaveAffectationsRapporteursNestDto } from 'src/nominations-context/dossier-de-nominations/adapters/primary/nestjs/dto/save-affectations-rapporteurs.nest-dto';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import { SessionRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/session.repository';
import { Affectation } from 'src/nominations-context/sessions/business-logic/models/affectation';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class SaveAffectationsRapporteursUseCase {
  constructor(
    private readonly affectationRepository: AffectationRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(dto: SaveAffectationsRapporteursNestDto): Promise<void> {
    const { sessionId, affectations } = dto;

    return this.transactionPerformer.perform(async (trx) => {
      const session = await this.sessionRepository.session(sessionId)(trx);

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      let affectationActuelle =
        await this.affectationRepository.bySessionId(sessionId)(trx);

      if (!affectationActuelle) {
        throw new Error(`Affectation for session ${sessionId} not found`);
      }

      if (affectationActuelle.estPubliee()) {
        const prochainNumero =
          await this.affectationRepository.prochainNumeroVersion(sessionId)(
            trx,
          );
        affectationActuelle = Affectation.creerNouvelleVersion(
          affectationActuelle,
          prochainNumero,
        );
      }

      const affectationsDossiersDeNominations = affectations.map(
        ({ dossierId, rapporteurIds, priorite }) => ({
          dossierDeNominationId: dossierId,
          rapporteurIds,
          priorite,
        }),
      );

      affectationActuelle.mettreAJourAffectations(
        affectationsDossiersDeNominations,
      );

      await this.affectationRepository.save(affectationActuelle)(trx);
    });
  }
}
