import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import {
  countCourtOfAppealFirstPresidentsRawQuery,
  listCourtOfAppealFirstPresidentsRawQuery,
} from '../../../../generated/prisma/sql';
import { DateOnly, dateOnlyJsonSchema } from '../../../../utils/date-only';
import { toMagistratFullTextQuery } from '../../../../utils/fulltext-search';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, paginate, Pagination } from '../../../framework/pagination';
import { Sortable } from '../../../framework/sorting';
import { magistratFullName } from '../../../magistrat/domain/magistrat-name';
import {
  COURT_OF_APPEAL_TYPE_ID,
  FIRST_PRESIDENT_FUNCTION_ID,
} from '../../domain/court-of-appeal-first-president';
import {
  HELD_POSITION_STATUS,
  heldPositionMatches,
  POSITION_STATUSES,
  type PositionStatus,
  positionStatuses,
  positionStatusOf,
  UNHELD_POSITION_STATUS,
  unheldPositionMatches,
} from '../../domain/position-status';
import type { ListCourtOfAppealFirstPresidentsDto } from '../dtos/veille-des-postes.dto';

@Injectable()
export class ListCourtOfAppealFirstPresidentsQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    pagination: Pagination;
    search: string | undefined;
    sorting: Sortable<ListCourtOfAppealFirstPresidentsDto>;
    statuses: readonly PositionStatus[];
  }): Promise<ListedCourtOfAppealFirstPresidentsDto> {
    const search = query.search?.trim() ? toMagistratFullTextQuery(query.search) : null;
    const held = heldPositionMatches(query.statuses);
    const unheld = unheldPositionMatches(query.statuses);
    const { limit, page } = query.pagination;

    const counts = await this.db.tx.$queryRawTyped(
      countCourtOfAppealFirstPresidentsRawQuery(COURT_OF_APPEAL_TYPE_ID, FIRST_PRESIDENT_FUNCTION_ID, search),
    );
    const heldCount = Number(counts.find((count) => count.held)?.seats ?? 0);
    const unheldCount = Number(counts.find((count) => !count.held)?.seats ?? 0);
    const courts =
      held || unheld
        ? await this.db.tx.$queryRawTyped(
            listCourtOfAppealFirstPresidentsRawQuery(
              COURT_OF_APPEAL_TYPE_ID,
              FIRST_PRESIDENT_FUNCTION_ID,
              search,
              held,
              unheld,
              query.sorting.sortBy ?? null,
              query.sorting.sortDesc,
              (page - 1) * limit,
              limit,
            ),
          )
        : [];

    return {
      ...paginate({
        items: courts.map((court) => ({
          court: { id: court.courtId, label: court.courtLabel ?? court.courtId },
          installationDate: court.installationDate
            ? DateOnly.fromUtcDate(court.installationDate).toJson()
            : null,
          magistrat: court.id ? { id: court.id, name: magistratFullName(court) } : null,
          status: positionStatusOf(court.id ? HELD_POSITION_STATUS : UNHELD_POSITION_STATUS),
        })),
        pagination: query.pagination,
        totalCount: (held ? heldCount : 0) + (unheld ? unheldCount : 0),
      }),
      statuses: positionStatuses().map((status) => ({
        ...status,
        count:
          status.id === HELD_POSITION_STATUS
            ? heldCount
            : status.id === UNHELD_POSITION_STATUS
              ? unheldCount
              : 0,
      })),
    };
  }
}

export class ListedCourtOfAppealFirstPresidentsDto extends createPaginatedZodDto(
  z.object({
    court: z.object({ id: z.string(), label: z.string() }),
    installationDate: dateOnlyJsonSchema.nullable(),
    magistrat: z.object({ id: z.string(), name: z.string() }).nullable(),
    status: z.object({ id: z.enum(POSITION_STATUSES), label: z.string() }),
  }),
  z.object({
    statuses: z.array(z.object({ count: z.number(), id: z.enum(POSITION_STATUSES), label: z.string() })),
  }),
) {}
