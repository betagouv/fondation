import { Injectable } from '@nestjs/common';

import { auditionScheduleKey } from '../../../../../utils/audition-schedule';
import { unaccent } from '../../../../../utils/unaccent';
import { Db } from '../../../../framework/database';
import { paginate, type Pagination } from '../../../../framework/pagination';
import type { RoleEnum } from '../../../../shared/role.enum';
import type { ListedSessionAuditionsDto } from '../dtos/session-audition.dto';
import { type SessionAudition, SessionAuditionsFinder } from '../finders/session-auditions.finder';

export function sortByName(a: SessionAudition, b: SessionAudition): number {
  return a.magistrat.name.localeCompare(b.magistrat.name);
}

@Injectable()
export class ListSessionAuditionsQuery {
  constructor(
    private readonly db: Db,
    private readonly sessionAuditions: SessionAuditionsFinder,
  ) {}

  async handle(query: {
    filters: {
      reporterIds: readonly (string | null)[];
      search: string | null;
    };
    pagination: Pagination;
    role: RoleEnum;
    sessionId: string;
    sortBy: 'auditionDate' | null;
    sortDesc: boolean;
  }): Promise<ListedSessionAuditionsDto> {
    // filtering and paging in memory is assumed: a session of 707 files lists its auditions in about 15 ms
    const auditions = await this.db.withTransaction(() => this.sessionAuditions.find(query));

    const search = unaccent(query.filters.search ?? '').toLowerCase();
    const reporterIds = new Set(query.filters.reporterIds);
    const matching = auditions
      .filter((audition) => !search || unaccent(audition.magistrat.name).toLowerCase().includes(search))
      .filter(
        (audition) =>
          reporterIds.size === 0 ||
          (reporterIds.has(null) && audition.reporters.length === 0) ||
          audition.reporters.some(({ id }) => reporterIds.has(id)),
      )
      .sort((a, b) => {
        if (query.sortBy !== 'auditionDate') return sortByName(a, b);
        if (!a.audition || !b.audition) return Number(!a.audition) - Number(!b.audition) || sortByName(a, b);
        return (
          auditionScheduleKey(a.audition).localeCompare(auditionScheduleKey(b.audition)) *
            (query.sortDesc ? -1 : 1) || sortByName(a, b)
        );
      });

    const { limit, page } = query.pagination;
    return paginate({
      items: matching.slice((page - 1) * limit, page * limit),
      pagination: query.pagination,
      totalCount: matching.length,
    });
  }
}
