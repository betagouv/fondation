import assert from 'node:assert';

import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { unaccent } from '../../../../utils/unaccent';
import { Db } from '../../../framework/database';
import { paginate, type Pagination } from '../../../framework/pagination';
import { MagistratService } from '../../../magistrat/magistrat.service';
import type { SessionStatus } from '../../../session/transparence/infrastructure/finders/session-statuses.finder';
import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import { sortByObservationBlock, sortBySessionThenObservationBlock } from '../../domain/observation-block';
import type { ObservationFollowUpEnum } from '../../domain/observation-follow-up';
import type { ListedFollowedUpObservationsDto } from '../dtos/followed-up-observation.dto';

import { toListedSessionObservation } from './list-session-observations.query';

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

      const followUps = new Set(query.filters.followUps);
      const sessionStatuses = new Set(query.filters.sessionStatuses);
      const search = unaccent(query.filters.search ?? '').toLowerCase();
      const matching = observations.flatMap((observation) => {
        // a deleted session is left out by the finder, and its observations with it
        const session = sessions.get(observation.sessionId);
        if (!session) return [];
        const status = statuses.get(observation.sessionId);
        assert.ok(status, `no status for the session ${observation.sessionId}`);
        const observant = observants.get(observation.magistratId);
        assert.ok(observant, `no profile for the observant ${observation.magistratId}`);

        if (followUps.size && !followUps.has(observation.followUp)) return [];
        if (sessionStatuses.size && !sessionStatuses.has(status)) return [];
        if (search && !unaccent(observant.name).toLowerCase().includes(search)) return [];
        return [{ ...observation, observant, session: { ...session, status } }];
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

      return paginate({
        items: pageItems.map((observation) => ({
          observation: toListedSessionObservation(observation, files),
          session: {
            date: observation.session.date.toJson(),
            id: observation.session.id,
            name: observation.session.name,
            status: observation.session.status,
          },
        })),
        pagination: query.pagination,
        totalCount: sorted.length,
      });
    });
  }
}
