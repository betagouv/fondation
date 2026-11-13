import { Injectable } from '@nestjs/common';

import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import type { HolderProposal } from '../../domain/position-alert';

@Injectable()
export class HolderProposalsFinder {
  constructor(private readonly sessions: TransparenceService) {}

  /** the earliest session not archived yet where each holder is proposed */
  async byHolders(query: { magistratIds: readonly string[] }): Promise<Map<string, HolderProposal>> {
    const propositions = await this.sessions.internalFindMagistratsPropositions(query);
    const sessionStatuses = await this.sessions.internalFindSessionStatuses({
      sessionIds: [...new Set([...propositions.values()].flat().map(({ session }) => session.id))],
    });

    return new Map(
      [...propositions].flatMap(([magistratId, ofMagistrat]) => {
        const ongoing = ofMagistrat.find(({ session }) => sessionStatuses.get(session.id) !== 'ARCHIVED');
        return ongoing
          ? [
              [
                magistratId,
                {
                  sessionDate: ongoing.session.date,
                  sessionName: ongoing.session.name,
                  targetedPosition: ongoing.targetedPosition,
                },
              ] as const,
            ]
          : [];
      }),
    );
  }
}
