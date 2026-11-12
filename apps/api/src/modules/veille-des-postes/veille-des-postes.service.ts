import { Injectable } from '@nestjs/common';

import { Pagination } from '../framework/pagination';
import { Sortable } from '../framework/sorting';

import type { CourtOfCassationPosition } from './domain/court-of-cassation-position';
import type { PositionStatus } from './domain/position-status';
import type {
  ListCourtOfAppealFirstPresidentsDto,
  ListCourtOfCassationHoldersDto,
} from './infrastructure/dtos/veille-des-postes.dto';
import {
  ListCourtOfAppealFirstPresidentsQuery,
  ListedCourtOfAppealFirstPresidentsDto,
} from './infrastructure/queries/list-court-of-appeal-first-presidents.query';
import {
  ListCourtOfCassationHoldersQuery,
  ListedCourtOfCassationHoldersDto,
} from './infrastructure/queries/list-court-of-cassation-holders.query';

@Injectable()
export class VeilleDesPostesService {
  constructor(
    private readonly listCourtOfAppealFirstPresidentsQuery: ListCourtOfAppealFirstPresidentsQuery,
    private readonly listCourtOfCassationHoldersQuery: ListCourtOfCassationHoldersQuery,
  ) {}

  listCourtOfAppealFirstPresidents(query: {
    pagination: Pagination;
    search: string | undefined;
    sorting: Sortable<ListCourtOfAppealFirstPresidentsDto>;
    statuses: readonly PositionStatus[];
  }): Promise<ListedCourtOfAppealFirstPresidentsDto> {
    return this.listCourtOfAppealFirstPresidentsQuery.handle(query);
  }

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
