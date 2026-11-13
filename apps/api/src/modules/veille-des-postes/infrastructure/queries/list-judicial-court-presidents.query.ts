import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import {
  countJudicialCourtPresidentsRawQuery,
  listJudicialCourtPresidentsRawQuery,
} from '../../../../generated/prisma/sql';
import { DateOnly, dateOnlyJsonSchema } from '../../../../utils/date-only';
import { toMagistratFullTextQuery } from '../../../../utils/fulltext-search';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, paginate, Pagination } from '../../../framework/pagination';
import { Sortable } from '../../../framework/sorting';
import { magistratFullName } from '../../../magistrat/domain/magistrat-name';
import { JUDICIAL_COURT_TYPE_ID, PRESIDENT_FUNCTION_ID } from '../../domain/judicial-court-president';
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
import type { ListJudicialCourtPresidentsDto } from '../dtos/veille-des-postes.dto';

type JudicialCourtsCount = countJudicialCourtPresidentsRawQuery.Result;

function seatsOf(counts: readonly JudicialCourtsCount[]): number {
  return counts.reduce((sum, count) => sum + Number(count.seats ?? 0), 0);
}

@Injectable()
export class ListJudicialCourtPresidentsQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    pagination: Pagination;
    ressorts: readonly string[];
    search: string | undefined;
    sorting: Sortable<ListJudicialCourtPresidentsDto>;
    statuses: readonly PositionStatus[];
  }): Promise<ListedJudicialCourtPresidentsDto> {
    const search = query.search?.trim() ? toMagistratFullTextQuery(query.search) : null;
    const held = heldPositionMatches(query.statuses);
    const unheld = unheldPositionMatches(query.statuses);
    const { limit, page } = query.pagination;

    const counts = await this.db.tx.$queryRawTyped(
      countJudicialCourtPresidentsRawQuery(JUDICIAL_COURT_TYPE_ID, PRESIDENT_FUNCTION_ID, search),
    );
    // each filter counts its values under the other filters, not under its own
    const inAskedRessorts = (count: JudicialCourtsCount) =>
      query.ressorts.length === 0 || query.ressorts.includes(count.ressortId);
    const ofAskedStatuses = (count: JudicialCourtsCount) => (count.held ? held : unheld);
    const totalCount = seatsOf(counts.filter((count) => inAskedRessorts(count) && ofAskedStatuses(count)));

    const courts =
      totalCount > 0
        ? await this.db.tx.$queryRawTyped(
            listJudicialCourtPresidentsRawQuery(
              JUDICIAL_COURT_TYPE_ID,
              PRESIDENT_FUNCTION_ID,
              search,
              held,
              unheld,
              query.sorting.sortBy ?? null,
              query.sorting.sortDesc,
              (page - 1) * limit,
              limit,
              [...query.ressorts],
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
          ressort: { id: court.ressortId, label: court.ressortLabel ?? court.ressortId },
          status: positionStatusOf(court.id ? HELD_POSITION_STATUS : UNHELD_POSITION_STATUS),
        })),
        pagination: query.pagination,
        totalCount,
      }),
      ressorts: [...Map.groupBy(counts, (count) => count.ressortId).values()].map((ofRessort) => ({
        count: seatsOf(ofRessort.filter(ofAskedStatuses)),
        id: ofRessort[0]!.ressortId,
        label: ofRessort[0]!.ressortLabel ?? ofRessort[0]!.ressortId,
      })),
      statuses: positionStatuses().map((status) => ({
        ...status,
        count: seatsOf(
          counts.filter(
            (count) =>
              inAskedRessorts(count) &&
              status.id === (count.held ? HELD_POSITION_STATUS : UNHELD_POSITION_STATUS),
          ),
        ),
      })),
    };
  }
}

export class ListedJudicialCourtPresidentsDto extends createPaginatedZodDto(
  z.object({
    court: z.object({ id: z.string(), label: z.string() }),
    installationDate: dateOnlyJsonSchema.nullable(),
    magistrat: z.object({ id: z.string(), name: z.string() }).nullable(),
    ressort: z.object({ id: z.string(), label: z.string() }),
    status: z.object({ id: z.enum(POSITION_STATUSES), label: z.string() }),
  }),
  z.object({
    ressorts: z.array(z.object({ count: z.number(), id: z.string(), label: z.string() })),
    statuses: z.array(z.object({ count: z.number(), id: z.enum(POSITION_STATUSES), label: z.string() })),
  }),
) {}
