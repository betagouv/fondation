import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import {
  countCourtOfCassationHoldersRawQuery,
  listCourtOfCassationHoldersRawQuery,
} from '../../../../generated/prisma/sql';
import { DateOnly, dateOnlyJsonSchema } from '../../../../utils/date-only';
import { toMagistratFullTextQuery } from '../../../../utils/fulltext-search';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, paginate, Pagination } from '../../../framework/pagination';
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
  type RankedLolfiPositions,
} from '../../domain/court-of-cassation-position';
import {
  HELD_POSITION_STATUS,
  heldPositionMatches,
  POSITION_STATUSES,
  type PositionStatus,
  positionStatuses,
  positionStatusOf,
} from '../../domain/position-status';
import type { ListCourtOfCassationHoldersDto } from '../dtos/veille-des-postes.dto';

// an empty grade stands for any grade: TypedSQL types the list without null
function sqlListsOf(positions: RankedLolfiPositions) {
  return { ...positions, gradeIds: positions.gradeIds.map((gradeId) => gradeId ?? '') };
}

@Injectable()
export class ListCourtOfCassationHoldersQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    pagination: Pagination;
    positions: readonly CourtOfCassationPosition[];
    search: string | undefined;
    sorting: Sortable<ListCourtOfCassationHoldersDto>;
    statuses: readonly PositionStatus[];
  }): Promise<ListedCourtOfCassationHoldersDto> {
    const every = sqlListsOf(rankedLolfiPositions([]));
    const asked = sqlListsOf(rankedLolfiPositions(query.positions));
    const search = query.search?.trim() ? toMagistratFullTextQuery(query.search) : null;
    const { limit, page } = query.pagination;

    const counts = await this.db.tx.$queryRawTyped(
      countCourtOfCassationHoldersRawQuery(
        COURT_OF_CASSATION_ID,
        every.functionIds,
        every.gradeIds,
        every.ranks,
        search,
      ),
    );
    const matches = heldPositionMatches(query.statuses);
    const holdersByRank = new Map(counts.map(({ holders, rank }) => [rank, Number(holders)]));
    // each filter counts its values under the other filters, not under its own
    const heldInAskedPositions = [...new Set(asked.ranks)].reduce(
      (sum, rank) => sum + (holdersByRank.get(rank) ?? 0),
      0,
    );
    const holders = !matches
      ? []
      : await this.db.tx.$queryRawTyped(
          listCourtOfCassationHoldersRawQuery(
            COURT_OF_CASSATION_ID,
            asked.functionIds,
            asked.gradeIds,
            asked.ranks,
            search,
            query.sorting.sortBy ?? null,
            query.sorting.sortDesc,
            (page - 1) * limit,
            limit,
          ),
        );

    return {
      ...paginate({
        items: holders.map((holder) => ({
          installationDate: holder.installationDate
            ? DateOnly.fromUtcDate(holder.installationDate).toJson()
            : null,
          magistrat: { id: holder.id, name: magistratFullName(holder) },
          position: courtOfCassationPositionOfRank(holder.rank!),
          service: holderServiceOf(holder.functionId),
          status: positionStatusOf(HELD_POSITION_STATUS),
        })),
        pagination: query.pagination,
        totalCount: matches ? heldInAskedPositions : 0,
      }),
      positions: courtOfCassationPositions().map((position, rank) => ({
        ...position,
        holders: matches ? (holdersByRank.get(rank) ?? 0) : 0,
      })),
      statuses: positionStatuses().map((status) => ({
        ...status,
        holders: status.id === HELD_POSITION_STATUS ? heldInAskedPositions : 0,
      })),
    };
  }
}

export class ListedCourtOfCassationHoldersDto extends createPaginatedZodDto(
  z.object({
    installationDate: dateOnlyJsonSchema.nullable(),
    magistrat: z.object({ id: z.string(), name: z.string() }),
    position: z.object({ id: z.enum(COURT_OF_CASSATION_POSITIONS), label: z.string() }),
    service: z.object({ id: z.enum(HOLDER_SERVICES), label: z.string() }),
    status: z.object({ id: z.enum(POSITION_STATUSES), label: z.string() }),
  }),
  z.object({
    positions: z.array(
      z.object({ holders: z.number(), id: z.enum(COURT_OF_CASSATION_POSITIONS), label: z.string() }),
    ),
    statuses: z.array(z.object({ holders: z.number(), id: z.enum(POSITION_STATUSES), label: z.string() })),
  }),
) {}
