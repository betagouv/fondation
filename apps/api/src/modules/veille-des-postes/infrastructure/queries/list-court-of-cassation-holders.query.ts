import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { listCourtOfCassationHoldersRawQuery } from '../../../../generated/prisma/sql';
import { DateOnly, dateOnlyJsonSchema } from '../../../../utils/date-only';
import { toMagistratFullTextQuery } from '../../../../utils/fulltext-search';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, pageOf, paginate, Pagination } from '../../../framework/pagination';
import { Sortable } from '../../../framework/sorting';
import { magistratFullName } from '../../../magistrat/domain/magistrat-name';
import {
  COURT_OF_CASSATION_ID,
  COURT_OF_CASSATION_POSITIONS,
  courtOfCassationPositionOfRank,
  courtOfCassationPositions,
  type CourtOfCassationPosition,
  HOLDER_SERVICES,
  holderServiceOf,
  rankedLolfiPositions,
} from '../../domain/court-of-cassation-position';
import { type AlertDeadline, alertRulesOf, alertsOf, type PositionAlert } from '../../domain/position-alert';
import { POSITION_STATUSES, type PositionStatus, positionStatusOf } from '../../domain/position-status';
import { sortedByUrgency } from '../../domain/position-urgency';
import type { ListCourtOfCassationHoldersDto } from '../dtos/veille-des-postes.dto';
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
export class ListCourtOfCassationHoldersQuery {
  constructor(
    private readonly db: Db,
    private readonly proposals: HolderProposalsFinder,
  ) {}

  @Transactional()
  async handle(query: {
    alerts: readonly PositionAlert[];
    deadlines: readonly AlertDeadline[];
    pagination: Pagination;
    positions: readonly CourtOfCassationPosition[];
    search: string | undefined;
    sorting: Sortable<ListCourtOfCassationHoldersDto>;
    statuses: readonly PositionStatus[];
  }): Promise<ListedCourtOfCassationHoldersDto> {
    const { functionIds, gradeIds, ranks } = rankedLolfiPositions();
    const search = query.search?.trim() ? toMagistratFullTextQuery(query.search) : null;
    const holders = await this.db.tx.$queryRawTyped(
      listCourtOfCassationHoldersRawQuery(
        COURT_OF_CASSATION_ID,
        functionIds,
        // an empty grade stands for any grade: TypedSQL types the list without null
        gradeIds.map((gradeId) => gradeId ?? ''),
        ranks,
        search,
        query.sorting.sortBy ?? null,
        query.sorting.sortDesc,
      ),
    );
    const proposals = await this.proposals.byHolders({ magistratIds: holders.map(({ id }) => id) });
    const today = DateOnly.fromInstantInParis(new Date());

    const rows = holders.map((holder) => {
      const positionId = courtOfCassationPositionOfRank(holder.rank!);
      const installationDate = DateOnly.fromOptionalUtcDate(holder.installationDate);
      const alerts = alertsOf(
        {
          birthDate: DateOnly.fromOptionalUtcDate(holder.birthDate),
          installationDate,
          proposal: proposals.get(holder.id) ?? null,
        },
        alertRulesOf(positionId),
        today,
      );
      return {
        alerts,
        installationDate: installationDate?.toJson() ?? null,
        magistrat: { id: holder.id, name: magistratFullName(holder) },
        positionId,
        service: holderServiceOf(holder.functionId),
        status: positionStatusOf({ alertCount: alerts.length, held: true }),
      };
    });

    const { counts, matching } = facetedRows(
      rows,
      { alert: query.alerts, deadline: query.deadlines, position: query.positions, status: query.statuses },
      (asked) => ({ ...statusAndAlertValues(asked), position: (row) => [row.positionId] }),
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
        items: pageOf(sorted, query.pagination).map(
          ({ alerts, installationDate, magistrat, service, status }) => ({
            alerts: alerts.map(alertJson),
            installationDate,
            magistrat,
            service,
            status,
          }),
        ),
        pagination: query.pagination,
        totalCount: matching.length,
      }),
      ...countedStatusAndAlertFacets(counts),
      positions: courtOfCassationPositions().map((position) => ({
        ...position,
        count: counts.position.get(position.id) ?? 0,
      })),
    };
  }
}

export class ListedCourtOfCassationHoldersDto extends createPaginatedZodDto(
  z.object({
    alerts: z.array(holderAlertSchema),
    installationDate: dateOnlyJsonSchema.nullable(),
    magistrat: z.object({ id: z.string(), name: z.string() }),
    service: z.object({ id: z.enum(HOLDER_SERVICES), label: z.string() }),
    status: z.object({ id: z.enum(POSITION_STATUSES), label: z.string() }),
  }),
  statusAndAlertFacetsSchema.extend({
    positions: z.array(
      z.object({ count: z.number(), id: z.enum(COURT_OF_CASSATION_POSITIONS), label: z.string() }),
    ),
  }),
) {}
