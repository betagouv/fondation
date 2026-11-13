import { Injectable } from '@nestjs/common';

import { Pagination } from '../framework/pagination';
import { Sortable } from '../framework/sorting';

import type { CourtOfCassationPosition } from './domain/court-of-cassation-position';
import type { PositionStatus } from './domain/position-status';
import type {
  ListCourtOfAppealFirstPresidentsDto,
  ListCourtOfCassationHoldersDto,
  ListJudicialCourtPresidentsDto,
} from './infrastructure/dtos/veille-des-postes.dto';
import {
  ListCourtOfAppealFirstPresidentsQuery,
  ListedCourtOfAppealFirstPresidentsDto,
} from './infrastructure/queries/list-court-of-appeal-first-presidents.query';
import {
  ListCourtOfCassationHoldersQuery,
  ListedCourtOfCassationHoldersDto,
} from './infrastructure/queries/list-court-of-cassation-holders.query';
import {
  ListedJudicialCourtPresidentsDto,
  ListJudicialCourtPresidentsQuery,
} from './infrastructure/queries/list-judicial-court-presidents.query';

@Injectable()
export class VeilleDesPostesService {
  constructor(
    private readonly listCourtOfAppealFirstPresidentsQuery: ListCourtOfAppealFirstPresidentsQuery,
    private readonly listCourtOfCassationHoldersQuery: ListCourtOfCassationHoldersQuery,
    private readonly listJudicialCourtPresidentsQuery: ListJudicialCourtPresidentsQuery,
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

  listJudicialCourtPresidents(query: {
    pagination: Pagination;
    ressorts: readonly string[];
    search: string | undefined;
    sorting: Sortable<ListJudicialCourtPresidentsDto>;
    statuses: readonly PositionStatus[];
  }): Promise<ListedJudicialCourtPresidentsDto> {
    return this.listJudicialCourtPresidentsQuery.handle(query);
  }
}
