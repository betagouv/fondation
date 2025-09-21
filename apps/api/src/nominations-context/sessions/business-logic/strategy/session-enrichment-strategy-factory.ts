import { TypeDeSaisine } from 'shared-models';
import { EnrichSessionStrategy } from './transparence-enrich-session.strategy';

export class SessionEnrichmentStrategyFactory {
  constructor(private readonly strategies: EnrichSessionStrategy[]) {}

  getStrategy(typeDeSaisine: TypeDeSaisine): EnrichSessionStrategy | null {
    return (
      this.strategies.find((strategy) => strategy.canHandle(typeDeSaisine)) ||
      null
    );
  }

  getAllStrategies(): EnrichSessionStrategy[] {
    return this.strategies;
  }
}
