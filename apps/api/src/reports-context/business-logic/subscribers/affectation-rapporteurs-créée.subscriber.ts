import { AffectationRapporteursCréeEventPayload } from 'src/nominations-context/business-logic/models/events/affectation-rapporteurs-crée.event';
import {
  CreateReportCommand,
  CreateReportUseCase,
} from '../use-cases/report-creation/create-report.use-case';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class AffectationRapporteursCrééeSubscriber {
  constructor(
    private readonly createReportUseCase: CreateReportUseCase,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async handle(payload: AffectationRapporteursCréeEventPayload) {
    const tupleIds = payload.affectationsDossiersDeNominations
      .map(({ dossierDeNominationId, rapporteurIds }) =>
        rapporteurIds.map(
          (rapporteurId) => [dossierDeNominationId, rapporteurId] as const,
        ),
      )
      .flat();

    return this.transactionPerformer.perform(
      async (trx) => {
        for (const [dossierDeNominationId, rapporteurId] of tupleIds) {
          const command = CreateReportCommand.create({
            dossierDeNominationId,
            rapporteurId,
            sessionId: payload.sessionId,
            formation: payload.formation,
          });

          await this.createReportUseCase.execute(command)(trx);
        }
      },
      {
        retries: 3,
      },
    );
  }
}
