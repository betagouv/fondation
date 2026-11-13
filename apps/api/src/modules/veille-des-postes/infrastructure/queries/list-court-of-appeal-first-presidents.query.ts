import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { listCourtOfAppealFirstPresidentsRawQuery } from '../../../../generated/prisma/sql';
import { DateOnly, dateOnlyJsonSchema } from '../../../../utils/date-only';
import { toMagistratFullTextQuery } from '../../../../utils/fulltext-search';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, pageOf, paginate, Pagination } from '../../../framework/pagination';
import { Sortable } from '../../../framework/sorting';
import { magistratFullName } from '../../../magistrat/domain/magistrat-name';
import {
  COURT_OF_APPEAL_TYPE_ID,
  FIRST_PRESIDENT_FUNCTION_ID,
} from '../../domain/court-of-appeal-first-president';
import { type AlertDeadline, alertRulesOf, alertsOf, type PositionAlert } from '../../domain/position-alert';
import { POSITION_STATUSES, type PositionStatus, positionStatusOf } from '../../domain/position-status';
import { sortedByUrgency } from '../../domain/position-urgency';
import type { ListCourtOfAppealFirstPresidentsDto } from '../dtos/veille-des-postes.dto';
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
export class ListCourtOfAppealFirstPresidentsQuery {
  constructor(
    private readonly db: Db,
    private readonly proposals: HolderProposalsFinder,
  ) {}

  @Transactional()
  async handle(query: {
    alerts: readonly PositionAlert[];
    deadlines: readonly AlertDeadline[];
    pagination: Pagination;
    search: string | undefined;
    sorting: Sortable<ListCourtOfAppealFirstPresidentsDto>;
    statuses: readonly PositionStatus[];
  }): Promise<ListedCourtOfAppealFirstPresidentsDto> {
    const search = query.search?.trim() ? toMagistratFullTextQuery(query.search) : null;
    const courts = await this.db.tx.$queryRawTyped(
      listCourtOfAppealFirstPresidentsRawQuery(
        COURT_OF_APPEAL_TYPE_ID,
        FIRST_PRESIDENT_FUNCTION_ID,
        search,
        query.sorting.sortBy ?? null,
        query.sorting.sortDesc,
      ),
    );
    const proposals = await this.proposals.byHolders({
      magistratIds: courts.flatMap(({ id }) => (id ? [id] : [])),
    });
    const today = DateOnly.fromInstantInParis(new Date());

    const rows = courts.map((court) => {
      const installationDate = DateOnly.fromOptionalUtcDate(court.installationDate);
      const alerts = court.id
        ? alertsOf(
            {
              birthDate: DateOnly.fromOptionalUtcDate(court.birthDate),
              installationDate,
              proposal: proposals.get(court.id) ?? null,
            },
            alertRulesOf('COURT_OF_APPEAL_FIRST_PRESIDENT'),
            today,
          )
        : [];
      return {
        alerts,
        court: { id: court.courtId, label: court.courtLabel ?? court.courtId },
        installationDate: installationDate?.toJson() ?? null,
        magistrat: court.id ? { id: court.id, name: magistratFullName(court) } : null,
        status: positionStatusOf({ alertCount: alerts.length, held: !!court.id }),
      };
    });

    const { counts, matching } = facetedRows(
      rows,
      { alert: query.alerts, deadline: query.deadlines, status: query.statuses },
      statusAndAlertValues,
    );
    const sorted =
      query.sorting.sortBy === 'status'
        ? sortedByUrgency(
            matching,
            { alert: query.alerts, deadline: query.deadlines },
            query.sorting.sortDesc,
          )
        : matching;

    return {
      ...paginate({
        items: pageOf(sorted, query.pagination).map((row) => ({ ...row, alerts: row.alerts.map(alertJson) })),
        pagination: query.pagination,
        totalCount: matching.length,
      }),
      ...countedStatusAndAlertFacets(counts),
    };
  }
}

export class ListedCourtOfAppealFirstPresidentsDto extends createPaginatedZodDto(
  z.object({
    alerts: z.array(holderAlertSchema),
    court: z.object({ id: z.string(), label: z.string() }),
    installationDate: dateOnlyJsonSchema.nullable(),
    magistrat: z.object({ id: z.string(), name: z.string() }).nullable(),
    status: z.object({ id: z.enum(POSITION_STATUSES), label: z.string() }),
  }),
  statusAndAlertFacetsSchema,
) {}
