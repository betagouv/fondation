import assert from 'node:assert';

import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { unaccent } from '../../../../utils/unaccent';
import { Db } from '../../../framework/database';
import { paginate, type Pagination } from '../../../framework/pagination';
import { MagistratService } from '../../../magistrat/magistrat.service';
import type { SessionStatus } from '../../../session/transparence/infrastructure/finders/session-statuses.finder';
import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import {
  laterPropositions,
  type ObservationBlockTrackingStatus,
  sortByObservationBlock,
  sortBySessionThenObservationBlock,
  UNTRACKED_BLOCK,
} from '../../domain/observation-block';
import type { ObservationFollowUpEnum } from '../../domain/observation-follow-up';
import type { ListedFollowedUpObservationsDto } from '../dtos/followed-up-observation.dto';

import { toListedSessionObservation } from './list-session-observations.query';

const blockKey = ({ magistratId, sessionId }: { magistratId: string; sessionId: string }) =>
  `${sessionId}:${magistratId}`;

@Injectable()
export class ListFollowedUpObservationsQuery {
  constructor(
    private readonly db: Db,
    private readonly magistrats: MagistratService,

    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  async handle(query: {
    filters: {
      followUps: readonly (ObservationFollowUpEnum | null)[];
      search: string | null;
      sessionStatuses: readonly SessionStatus[];
      trackingStatuses: readonly ObservationBlockTrackingStatus[];
    };
    pagination: Pagination;
    sortBy: 'dateReception' | 'session' | null;
    sortDesc: boolean;
  }): Promise<ListedFollowedUpObservationsDto> {
    return this.db.withTransaction(async () => {
      // only the observations with a suite are listed: a few per session, filtered, sorted and paged
      // here so that the bloc ordering stays in one pure function
      const observations = await this.db.tx.observation.findMany({
        select: {
          dateReception: true,
          followUp: true,
          id: true,
          magistratId: true,
          nominationFileId: true,
          sessionId: true,
        } satisfies Prisma.ObservationSelect,
        where: { followUp: { not: null } },
      });
      const sessionIds = [...new Set(observations.map(({ sessionId }) => sessionId))];
      const sessions = await this.sessions.internalFindSessions({ sessionIds });
      const statuses = await this.sessions.internalFindSessionStatuses({ sessionIds });
      const observants = await this.magistrats.internalFindMagistratProfiles({
        magistratIds: [...new Set(observations.map(({ magistratId }) => magistratId))],
      });
      const trackings = await this.db.tx.observationBlockTracking.findMany({
        select: {
          comment: true,
          magistratId: true,
          sessionId: true,
          status: true,
        } satisfies Prisma.ObservationBlockTrackingSelect,
        where: { sessionId: { in: sessionIds } },
      });
      const trackingByBlock = new Map(
        trackings.map(({ comment, magistratId, sessionId, status }) => [
          blockKey({ magistratId, sessionId }),
          { comment, status },
        ]),
      );

      const followUps = new Set(query.filters.followUps);
      const sessionStatuses = new Set(query.filters.sessionStatuses);
      const trackingStatuses = new Set(query.filters.trackingStatuses);
      const search = unaccent(query.filters.search ?? '').toLowerCase();
      const matching = observations.flatMap((observation) => {
        // a deleted session is left out by the finder, and its observations with it
        const session = sessions.get(observation.sessionId);
        if (!session) return [];
        const status = statuses.get(observation.sessionId);
        assert.ok(status, `no status for the session ${observation.sessionId}`);
        const observant = observants.get(observation.magistratId);
        assert.ok(observant, `no profile for the observant ${observation.magistratId}`);
        const tracking = trackingByBlock.get(blockKey(observation)) ?? UNTRACKED_BLOCK;

        if (followUps.size && !followUps.has(observation.followUp)) return [];
        if (sessionStatuses.size && !sessionStatuses.has(status)) return [];
        if (trackingStatuses.size && !trackingStatuses.has(tracking.status)) return [];
        if (search && !unaccent(observant.name).toLowerCase().includes(search)) return [];
        return [{ ...observation, observant, session: { ...session, status }, tracking }];
      });

      const sortedFileIds = await this.sessions.internalSortNominationFiles({
        nominationFileIds: [...new Set(matching.map(({ nominationFileId }) => nominationFileId))],
      });
      const fileRanks = new Map(sortedFileIds.map((id, rank) => [id, rank]));
      const blocked = matching.map((observation) => ({
        ...observation,
        fileRank: fileRanks.get(observation.nominationFileId) ?? sortedFileIds.length,
        observantId: observation.magistratId,
        observantName: observation.observant.name,
        sessionDate: observation.session.date.toDate(),
      }));
      // most recent first unless a column is explicitly sorted ascending
      const order = query.sortBy && !query.sortDesc ? 'asc' : 'desc';
      const sorted =
        query.sortBy === 'dateReception'
          ? sortByObservationBlock(blocked, order)
          : sortBySessionThenObservationBlock(blocked, order);

      const { limit, page } = query.pagination;
      const pageItems = sorted.slice((page - 1) * limit, page * limit);
      const files = await this.sessions.internalFindNominationFilesByIds({
        nominationFileIds: pageItems.map(({ nominationFileId }) => nominationFileId),
      });
      const magistratIds = [...new Set(pageItems.map(({ magistratId }) => magistratId))];
      const propositions = await this.sessions.internalFindMagistratsPropositions({ magistratIds });
      // the bloc counts all the observations of the observant in the session, those without a suite too
      const blocks = await this.db.tx.observation.groupBy({
        _max: { dateReception: true },
        by: ['magistratId', 'sessionId'],
        where: {
          magistratId: { in: magistratIds },
          sessionId: { in: [...new Set(pageItems.map(({ sessionId }) => sessionId))] },
        },
      });
      const lastReceptionByBlock = new Map(
        blocks.map(({ _max, magistratId, sessionId }) => [
          blockKey({ magistratId, sessionId }),
          _max.dateReception,
        ]),
      );

      return paginate({
        items: pageItems.map((observation) => ({
          laterPropositions: laterPropositions(
            {
              lastReception: lastReceptionByBlock.get(blockKey(observation)) ?? observation.dateReception,
              sessionId: observation.sessionId,
            },
            propositions.get(observation.magistratId) ?? [],
          ).map(({ id, number, session, targetedGrade, targetedPosition }) => ({
            id,
            number,
            session: { date: session.date.toJson(), id: session.id, name: session.name },
            targeted: { grade: targetedGrade, position: targetedPosition },
          })),
          observation: toListedSessionObservation(observation, files),
          session: {
            date: observation.session.date.toJson(),
            id: observation.session.id,
            name: observation.session.name,
            status: observation.session.status,
          },
          tracking: observation.tracking,
        })),
        pagination: query.pagination,
        totalCount: sorted.length,
      });
    });
  }
}
