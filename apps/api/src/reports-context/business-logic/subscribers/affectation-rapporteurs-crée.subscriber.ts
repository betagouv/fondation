import { AffectationRapporteursCréeEventPayload } from 'src/nominations-context/business-logic/models/events/affectation-rapporteurs-crée.event';
import {
  CreateReportCommand,
  CreateReportUseCase,
} from '../use-cases/report-creation/create-report.use-case';

export class AffectationRapporteursCrééeSubscriber {
  constructor(private readonly createReportUseCase: CreateReportUseCase) {}

  async handle(payload: AffectationRapporteursCréeEventPayload) {
    for (const affectation of payload.affectationsDossiersDeNominations) {
      const command = CreateReportCommand.create({
        dossierDeNominationId: affectation.dossierDeNominationId,
        sessionId: payload.sessionId,
        formation: payload.formation,
        rapporteurId: affectation.rapporteurIds[0]!,
      });

      await this.createReportUseCase.execute(command);
    }
  }
}
