import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { assertPgParams } from '../../../../utils/assert-pg-params';
import { Db } from '../../../framework/database';
import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import { type HolderProposal, proposalStageOf } from '../../domain/position-alert';

@Injectable()
export class HolderProposalsFinder {
  constructor(
    private readonly db: Db,
    private readonly sessions: TransparenceService,
  ) {}

  /** the earliest proposal each holder is still awaiting */
  async byHolders(query: { magistratIds: readonly string[] }): Promise<Map<string, HolderProposal>> {
    const propositions = await this.sessions.internalFindMagistratsPropositions(query);
    const proposed = [...propositions.values()].flat();
    const fileIds = new Set(proposed.map(({ id }) => id));
    const sessionStatuses = await this.sessions.internalFindSessionStatuses({
      sessionIds: [...new Set(proposed.map(({ session }) => session.id))],
    });
    const reportedIds = await this.sessions.internalFindReportedNominationFiles({
      nominationFileIds: fileIds,
    });
    const outcomes = await this.sessions.internalFindNominationFileOutcomes({ nominationFileIds: fileIds });
    const holderIds = [...propositions.keys()];
    assertPgParams(holderIds);
    const holders = await this.db.tx.magistrat.findMany({
      select: { currentPositionId: true, id: true } satisfies Prisma.MagistratSelect,
      where: { id: { in: holderIds } },
    });
    const currentPositionIds = new Map(
      holders.map(({ currentPositionId, id }) => [id, Number.parseInt(currentPositionId ?? '', 10)]),
    );

    const earliest = new Map<string, HolderProposal>();
    for (const [magistratId, ofMagistrat] of propositions) {
      for (const proposition of ofMagistrat) {
        const stage = proposalStageOf({
          isArchived: sessionStatuses.get(proposition.session.id) === 'ARCHIVED',
          isOnTargetedPosition: currentPositionIds.get(magistratId) === proposition.targetedPositionId,
          isReported: reportedIds.has(proposition.id),
          outcome: outcomes.get(proposition.id) ?? null,
        });
        if (!stage) continue;

        earliest.set(magistratId, {
          sessionDate: proposition.session.date,
          sessionName: proposition.session.name,
          stage,
          targetedPosition: proposition.targetedPosition,
        });
        break;
      }
    }
    return earliest;
  }
}
