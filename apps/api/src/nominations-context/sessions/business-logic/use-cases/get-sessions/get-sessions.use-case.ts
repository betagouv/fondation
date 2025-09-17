import { SessionMetadataSnapshot } from 'shared-models';
import { SessionRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/session.repository';
import { SessionEnrichmentService } from 'src/nominations-context/sessions/business-logic/services/session-enrichment.service';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class GetSessionsUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly sessionEnrichmentService: SessionEnrichmentService,
  ) {}

  async execute(): Promise<SessionMetadataSnapshot[]> {
    return this.transactionPerformer.perform(async (trx) => {
      const sessions = await this.sessionRepository.findAll()(trx);
      const enrichedSessions =
        await this.sessionEnrichmentService.enrichSessions(sessions, trx);
      return enrichedSessions.slice().sort((a, b) => {
        const dateA = new Date(
          a.dateTransparence.year,
          a.dateTransparence.month - 1,
          a.dateTransparence.day,
        );
        const dateB = new Date(
          b.dateTransparence.year,
          b.dateTransparence.month - 1,
          b.dateTransparence.day,
        );
        return dateB.getTime() - dateA.getTime();
      });
    });
  }
}
