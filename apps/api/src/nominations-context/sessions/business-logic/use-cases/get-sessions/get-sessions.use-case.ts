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
      return this.sessionEnrichmentService.enrichSessions(sessions, trx);
    });
  }
}
