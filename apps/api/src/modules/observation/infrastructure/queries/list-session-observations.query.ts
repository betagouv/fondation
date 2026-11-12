import assert from 'node:assert';

import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { DateOnly } from '../../../../utils/date-only';
import { unaccent } from '../../../../utils/unaccent';
import { Db } from '../../../framework/database';
import { paginate, type Pagination } from '../../../framework/pagination';
import { MagistratService } from '../../../magistrat/magistrat.service';
import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import type { RoleEnum } from '../../../shared/role.enum';
import { sortByObservationBlock } from '../../domain/observation-block';
import type { ObservationFollowUpEnum } from '../../domain/observation-follow-up';
import type { ListedSessionObservationsDto } from '../dtos/session-observation.dto';

@Injectable()
export class ListSessionObservationsQuery {
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
    };
    pagination: Pagination;
    role: RoleEnum;
    sessionId: string;
    sortBy: 'dateReception' | null;
    sortDesc: boolean;
  }): Promise<ListedSessionObservationsDto> {
    return this.db.withTransaction(async () => {
      await this.sessions.internalGetVisibleSession(query);

      // a session receives a few hundred observations at most: filtering, sorting and paging them here
      // keeps the bloc ordering in one pure function
      const observations = await this.db.tx.observation.findMany({
        select: {
          dateReception: true,
          followUp: true,
          id: true,
          magistratId: true,
          nominationFileId: true,
        } satisfies Prisma.ObservationSelect,
        where: { sessionId: query.sessionId },
      });
      const observants = await this.magistrats.internalFindMagistratProfiles({
        magistratIds: [...new Set(observations.map(({ magistratId }) => magistratId))],
      });

      const followUps = new Set(query.filters.followUps);
      const search = unaccent(query.filters.search ?? '').toLowerCase();
      const matching = observations.flatMap((observation) => {
        const observant = observants.get(observation.magistratId);
        assert.ok(observant, `no profile for the observant ${observation.magistratId}`);

        if (followUps.size && !followUps.has(observation.followUp)) return [];
        if (search && !unaccent(observant.name).toLowerCase().includes(search)) return [];
        return [{ ...observation, observant }];
      });

      const sortedFileIds = await this.sessions.internalSortNominationFiles({
        nominationFileIds: [...new Set(matching.map(({ nominationFileId }) => nominationFileId))],
      });
      const fileRanks = new Map(sortedFileIds.map((id, rank) => [id, rank]));
      const sorted = sortByObservationBlock(
        matching.map((observation) => ({
          ...observation,
          fileRank: fileRanks.get(observation.nominationFileId) ?? sortedFileIds.length,
          observantId: observation.magistratId,
          observantName: observation.observant.name,
        })),
        // most recent first unless the reception date is explicitly sorted ascending
        query.sortBy === 'dateReception' && !query.sortDesc ? 'asc' : 'desc',
      );

      const { limit, page } = query.pagination;
      const pageItems = sorted.slice((page - 1) * limit, page * limit);
      const files = await this.sessions.internalFindNominationFilesByIds({
        nominationFileIds: pageItems.map(({ nominationFileId }) => nominationFileId),
      });

      return paginate({
        items: pageItems.map((observation) => {
          const file = files.get(observation.nominationFileId);
          assert.ok(file, `no nomination file ${observation.nominationFileId}`);

          return {
            dateReception: DateOnly.fromUtcDate(observation.dateReception).toJson(),
            followUp: observation.followUp,
            id: observation.id,
            nominationFile: {
              id: observation.nominationFileId,
              magistrat: {
                currentPosition: file.currentPosition,
                grade: file.grade,
                id: file.detectedMagistratId,
                name: file.name,
              },
              number: file.number,
              targeted: { grade: file.targetedGrade, position: file.targetedPosition },
            },
            observant: {
              currentPosition: observation.observant.currentPosition,
              id: observation.magistratId,
              name: observation.observant.name,
            },
          };
        }),
        pagination: query.pagination,
        totalCount: sorted.length,
      });
    });
  }
}
