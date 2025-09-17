import { SessionMetadataSnapshot, TypeDeSaisine } from 'shared-models';

import { TransparenceRepository } from 'src/nominations-context/pp-gds/transparences/business-logic/gateways/repositories/transparence.repository';
import { Session } from 'src/nominations-context/sessions/business-logic/models/session';

export interface EnrichSessionStrategy {
  canHandle(typeDeSaisine: TypeDeSaisine): boolean;
  enrichSessions(
    sessions: Session[],
    trx: any,
  ): Promise<SessionMetadataSnapshot[]>;
}

export class TransparenceEnrichSessionStrategyImpl
  implements EnrichSessionStrategy
{
  constructor(
    private readonly transparenceRepository: TransparenceRepository,
  ) {}

  canHandle(typeDeSaisine: TypeDeSaisine): boolean {
    return typeDeSaisine === TypeDeSaisine.TRANSPARENCE_GDS;
  }

  async enrichSessions(
    sessions: Session[],
    trx: any,
  ): Promise<SessionMetadataSnapshot[]> {
    if (sessions.length === 0) return [];

    return (
      await this.transparenceRepository.findMetaDataBySessionIds(sessions)(trx)
    ).map((metadata) => metadata.snapshot());
  }
}
