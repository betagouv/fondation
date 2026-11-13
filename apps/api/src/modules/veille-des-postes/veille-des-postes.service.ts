import { Injectable } from '@nestjs/common';

import { Pagination } from '../framework/pagination';
import { Sortable } from '../framework/sorting';

import type { CourtOfCassationPosition } from './domain/court-of-cassation-position';
import type { AlertDeadline, PositionAlert } from './domain/position-alert';
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

type StatusAndAlertFilters = {
  alerts: readonly PositionAlert[];
  deadlines: readonly AlertDeadline[];
  pagination: Pagination;
  search: string | undefined;
  statuses: readonly PositionStatus[];
};

@Injectable()
export class VeilleDesPostesService {
  constructor(
    private readonly listCourtOfAppealFirstPresidentsQuery: ListCourtOfAppealFirstPresidentsQuery,
    private readonly listCourtOfCassationHoldersQuery: ListCourtOfCassationHoldersQuery,
    private readonly listJudicialCourtPresidentsQuery: ListJudicialCourtPresidentsQuery,
  ) {}

  listCourtOfAppealFirstPresidents(
    query: StatusAndAlertFilters & { sorting: Sortable<ListCourtOfAppealFirstPresidentsDto> },
  ): Promise<ListedCourtOfAppealFirstPresidentsDto> {
    return this.listCourtOfAppealFirstPresidentsQuery.handle(query);
  }

  listCourtOfCassationHolders(
    query: StatusAndAlertFilters & {
      positions: readonly CourtOfCassationPosition[];
      sorting: Sortable<ListCourtOfCassationHoldersDto>;
    },
  ): Promise<ListedCourtOfCassationHoldersDto> {
    return this.listCourtOfCassationHoldersQuery.handle(query);
  }

  listJudicialCourtPresidents(
    query: StatusAndAlertFilters & {
      ressorts: readonly string[];
      sorting: Sortable<ListJudicialCourtPresidentsDto>;
    },
  ): Promise<ListedJudicialCourtPresidentsDto> {
    return this.listJudicialCourtPresidentsQuery.handle(query);
  }
}
