import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { listJudicialCourtPresidentsRawQuery } from '../../../../generated/prisma/sql';
import { DateOnly, dateOnlyJsonSchema } from '../../../../utils/date-only';
import { toMagistratFullTextQuery } from '../../../../utils/fulltext-search';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, pageOf, paginate, Pagination } from '../../../framework/pagination';
import { Sortable } from '../../../framework/sorting';
import { magistratFullName } from '../../../magistrat/domain/magistrat-name';
import { JUDICIAL_COURT_TYPE_ID, PRESIDENT_FUNCTION_ID } from '../../domain/judicial-court-president';
import { type AlertDeadline, alertRulesOf, alertsOf, type PositionAlert } from '../../domain/position-alert';
import { POSITION_STATUSES, type PositionStatus, positionStatusOf } from '../../domain/position-status';
import { sortedByUrgency } from '../../domain/position-urgency';
import type { ListJudicialCourtPresidentsDto } from '../dtos/veille-des-postes.dto';
import { facetedRows } from '../faceted-rows';
import { HolderProposalsFinder } from '../finders/holder-proposals.finder';
import {
  alertJson,
  countedStatusAndAlertFacets,
  holderAlertSchema,
  statusAndAlertFacetsSchema,
  statusAndAlertValues,
} from '../holder-alerts';

@Injectable()
export class ListJudicialCourtPresidentsQuery {
  constructor(
    private readonly db: Db,
    private readonly proposals: HolderProposalsFinder,
  ) {}

  @Transactional()
  async handle(query: {
    alerts: readonly PositionAlert[];
    deadlines: readonly AlertDeadline[];
    pagination: Pagination;
    ressorts: readonly string[];
    search: string | undefined;
    sorting: Sortable<ListJudicialCourtPresidentsDto>;
    statuses: readonly PositionStatus[];
  }): Promise<ListedJudicialCourtPresidentsDto> {
    const search = query.search?.trim() ? toMagistratFullTextQuery(query.search) : null;
    const courts = await this.db.tx.$queryRawTyped(
      listJudicialCourtPresidentsRawQuery(
        JUDICIAL_COURT_TYPE_ID,
        PRESIDENT_FUNCTION_ID,
        search,
        query.sorting.sortBy ?? null,
        query.sorting.sortDesc,
      ),
    );
    const searched = courts.filter(({ matchesSearch }) => matchesSearch);
    const proposals = await this.proposals.byHolders({
      magistratIds: searched.flatMap(({ id }) => (id ? [id] : [])),
    });
    const today = DateOnly.fromInstantInParis(new Date());

    const rows = searched.map((court) => {
      const installationDate = DateOnly.fromOptionalUtcDate(court.installationDate);
      const alerts = court.id
        ? alertsOf(
            {
              birthDate: DateOnly.fromOptionalUtcDate(court.birthDate),
              installationDate,
              proposal: proposals.get(court.id) ?? null,
            },
            alertRulesOf('JUDICIAL_COURT_PRESIDENT'),
            today,
          )
        : [];
      return {
        alerts,
        court: { id: court.courtId, label: court.courtLabel ?? court.courtId },
        installationDate: installationDate?.toJson() ?? null,
        magistrat: court.id ? { id: court.id, name: magistratFullName(court) } : null,
        ressort: { id: court.ressortId, label: court.ressortLabel ?? court.ressortId },
        status: positionStatusOf({ alertCount: alerts.length, held: !!court.id }),
      };
    });

    const { counts, matching } = facetedRows(
      rows,
      { alert: query.alerts, deadline: query.deadlines, ressort: query.ressorts, status: query.statuses },
      (asked) => ({ ...statusAndAlertValues(asked), ressort: (row) => [row.ressort.id] }),
    );
    const sorted =
      query.sorting.sortBy === 'status'
        ? sortedByUrgency(
            matching,
            { alert: query.alerts, deadline: query.deadlines },
            query.sorting.sortDesc,
          )
        : matching;
    // every ressort stays listed, even without a court matching the search, in the order of their codes
    const ressorts = new Map(courts.map((court) => [court.ressortId, court.ressortLabel ?? court.ressortId]));

    return {
      ...paginate({
        items: pageOf(sorted, query.pagination).map((row) => ({ ...row, alerts: row.alerts.map(alertJson) })),
        pagination: query.pagination,
        totalCount: matching.length,
      }),
      ...countedStatusAndAlertFacets(counts),
      ressorts: [...ressorts]
        .toSorted(([a], [b]) => a.localeCompare(b))
        .map(([id, label]) => ({ count: counts.ressort.get(id) ?? 0, id, label })),
    };
  }
}

export class ListedJudicialCourtPresidentsDto extends createPaginatedZodDto(
  z.object({
    alerts: z.array(holderAlertSchema),
    court: z.object({ id: z.string(), label: z.string() }),
    installationDate: dateOnlyJsonSchema.nullable(),
    magistrat: z.object({ id: z.string(), name: z.string() }).nullable(),
    ressort: z.object({ id: z.string(), label: z.string() }),
    status: z.object({ id: z.enum(POSITION_STATUSES), label: z.string() }),
  }),
  statusAndAlertFacetsSchema.extend({
    ressorts: z.array(z.object({ count: z.number(), id: z.string(), label: z.string() })),
  }),
) {}
