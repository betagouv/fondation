import { AffectationRapporteursModifiéeEventPayload } from 'src/nominations-context/sessions/business-logic/models/events/affectation-rapporteurs-modifiée.event';
import { ReportRepository } from 'src/reports-context/business-logic/gateways/repositories/report.repository';
import {
  CreateReportCommand,
  CreateReportUseCase,
} from 'src/reports-context/business-logic/use-cases/report-creation/create-report.use-case';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class HandleAffectationUpdatedUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly createReportUseCase: CreateReportUseCase,
  ) {}

  execute(
    payload: AffectationRapporteursModifiéeEventPayload,
  ): TransactionableAsync {
    return async (trx) => {
      // Récupérer tous les rapports existants pour la session
      const existingReports = await this.reportRepository.bySessionId(
        payload.sessionId,
      )(trx);

      // Créer un Set des rapporteurs affectés (paires dossier-rapporteur)
      const affectedPairs = new Set(
        payload.affectationsDossiersDeNominations.flatMap(
          ({ dossierDeNominationId, rapporteurIds }) =>
            rapporteurIds.map(
              (rapporteurId) => `${dossierDeNominationId}:${rapporteurId}`,
            ),
        ),
      );

      // Si les rapports existent, identifier ceux à supprimer
      if (existingReports && existingReports.length > 0) {
        const existingPairs = new Map(
          existingReports.map((report) => [
            `${report.dossierDeNominationId}:${report.reporterId}`,
            report.id,
          ]),
        );

        // Identifier les rapports à supprimer (rapporteurs non présents dans les nouvelles affectations)
        for (const [pair, reportId] of existingPairs) {
          if (!affectedPairs.has(pair)) {
            // Supprimer ce rapport et ses report_rules (CASCADE en DB)
            await this.reportRepository.delete(reportId)(trx);
          }
        }

        // Créer seulement les nouveaux rapports (qui n'existent pas déjà)
        for (const {
          dossierDeNominationId,
          rapporteurIds,
        } of payload.affectationsDossiersDeNominations) {
          for (const rapporteurId of rapporteurIds) {
            const pair = `${dossierDeNominationId}:${rapporteurId}`;
            if (!existingPairs.has(pair)) {
              // Créer le nouveau rapport avec les report_rules
              const command = CreateReportCommand.create({
                dossierDeNominationId,
                rapporteurId,
                sessionId: payload.sessionId,
                formation: payload.formation,
              });

              await this.createReportUseCase.execute(command)(trx);
            }
          }
        }
      } else {
        // Aucun rapport existant, créer tous les rapports
        for (const {
          dossierDeNominationId,
          rapporteurIds,
        } of payload.affectationsDossiersDeNominations) {
          for (const rapporteurId of rapporteurIds) {
            const command = CreateReportCommand.create({
              dossierDeNominationId,
              rapporteurId,
              sessionId: payload.sessionId,
              formation: payload.formation,
            });

            await this.createReportUseCase.execute(command)(trx);
          }
        }
      }
    };
  }
}
