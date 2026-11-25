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
  COURT_OF_CASSATION_POSITIONS,
  type CourtOfCassationPosition,
} from '../../../shared/court-of-cassation-position.enum';
import {
  COURT_OF_CASSATION_ID,
  courtOfCassationPositionOfRank,
  courtOfCassationPositions,
  HOLDER_SERVICES,
  holderServiceOf,
  rankedLolfiPositions,
} from '../../domain/court-of-cassation-position';
import { civilityOf, courtOfCassationHolderTitle } from '../../domain/holder-title';
import { type AlertDeadline, alertRulesOf, alertsOf, type PositionAlert } from '../../domain/position-alert';
import { commentPreviewOf } from '../../domain/position-comment';
import { type PositionStatus, positionStatusOf } from '../../domain/position-status';
import { sortedByUrgency } from '../../domain/position-urgency';
import type { ListCourtOfCassationHoldersDto } from '../dtos/veille-des-postes.dto';
import { facetedRows } from '../faceted-rows';
import { HolderProposalsFinder } from '../finders/holder-proposals.finder';
import {
  alertJson,
  countedStatusAndAlertFacets,
  holderAlertSchema,
  positionStatusSchema,
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
      const service = holderServiceOf(holder.functionId);
      const installationDate = DateOnly.fromOptionalUtcDate(holder.installationDate);
      const vacancyStartDate = DateOnly.fromOptionalUtcDate(holder.vacancyStartDate);
      const vacancy =
        holder.vacancyReason && vacancyStartDate
          ? {
              reason: holder.vacancyReason,
              reasonDetail: holder.vacancyReasonDetail,
              startDate: vacancyStartDate,
            }
          : null;
      const alerts = alertsOf(
        {
          birthDate: DateOnly.fromOptionalUtcDate(holder.birthDate),
          civility: civilityOf(holder.civility),
          installationDate,
          proposal: proposals.get(holder.id) ?? null,
        },
        alertRulesOf(positionId),
        today,
      );
      return {
        alerts,
        installationDate: installationDate?.toJson() ?? null,
        magistrat: {
          commentPreview: commentPreviewOf(holder.comment),
          id: holder.id,
          name: magistratFullName(holder),
          title: courtOfCassationHolderTitle({
            civility: civilityOf(holder.civility),
            position: positionId,
            service: service.id,
          }),
        },
        positionId,
        service,
        status: positionStatusOf({ alertCount: alerts.length, held: true, vacancy }, today),
        vacancyStartDate,
      };
    });

    const { counts, matching } = facetedRows(
      rows,
      { alert: query.alerts, deadline: query.deadlines, position: query.positions, status: query.statuses },
      (asked) => ({ ...statusAndAlertValues(asked, today), position: (row) => [row.positionId] }),
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
    magistrat: z.object({
      commentPreview: z.string().nullable(),
      id: z.string(),
      name: z.string(),
      title: z.string(),
    }),
    service: z.object({ id: z.enum(HOLDER_SERVICES), label: z.string() }),
    status: positionStatusSchema,
  }),
  statusAndAlertFacetsSchema.extend({
    positions: z.array(
      z.object({ count: z.number(), id: z.enum(COURT_OF_CASSATION_POSITIONS), label: z.string() }),
    ),
  }),
) {}
