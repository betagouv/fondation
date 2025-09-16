import { SessionMetadataSnapshot, TypeDeSaisine } from 'shared-models';
import { Session } from 'src/nominations-context/sessions/business-logic/models/session';
import { SessionEnrichmentStrategyFactory } from '../strategy/session-enrichment-strategy-factory';

export class SessionEnrichmentService {
  constructor(
    private readonly strategyFactory: SessionEnrichmentStrategyFactory,
  ) {}

  async enrichSessions(
    sessions: Session[],
    trx: any,
  ): Promise<SessionMetadataSnapshot[]> {
    const sessionsByType = this.groupSessionsByType(sessions);

    const enrichedSessions: SessionMetadataSnapshot[] = [];

    for (const [typeDeSaisine, sessionsOfType] of Object.entries(
      sessionsByType,
    )) {
      const strategy = this.strategyFactory.getStrategy(
        typeDeSaisine as TypeDeSaisine,
      );

      if (strategy) {
        const enriched = await strategy.enrichSessions(sessionsOfType, trx);
        enrichedSessions.push(...enriched);
      } else {
        throw new Error(
          `No strategy found for type de saisine: ${typeDeSaisine}`,
        );
      }
    }

    return enrichedSessions;
  }

  private groupSessionsByType(
    sessions: Session[],
  ): Record<TypeDeSaisine, Session[]> {
    return sessions.reduce(
      (acc, session) => {
        const type = session.typeDeSaisine as TypeDeSaisine;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(session);
        return acc;
      },
      {} as Record<TypeDeSaisine, Session[]>,
    );
  }
}
