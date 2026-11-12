import { Injectable } from '@nestjs/common';

import { Pagination } from '../framework/pagination';
import { Sortable } from '../framework/sorting';

import type { CourtOfCassationPosition } from './domain/court-of-cassation-position';
import type { PositionStatus } from './domain/position-status';
import type { ListCourtOfCassationHoldersDto } from './infrastructure/dtos/veille-des-postes.dto';
import {
  ListCourtOfCassationHoldersQuery,
  ListedCourtOfCassationHoldersDto,
} from './infrastructure/queries/list-court-of-cassation-holders.query';

@Injectable()
export class VeilleDesPostesService {
  constructor(private readonly listCourtOfCassationHoldersQuery: ListCourtOfCassationHoldersQuery) {}

  listCourtOfCassationHolders(query: {
    pagination: Pagination;
    positions: readonly CourtOfCassationPosition[];
    search: string | undefined;
    sorting: Sortable<ListCourtOfCassationHoldersDto>;
    statuses: readonly PositionStatus[];
  }): Promise<ListedCourtOfCassationHoldersDto> {
    return this.listCourtOfCassationHoldersQuery.handle(query);
  }
}
