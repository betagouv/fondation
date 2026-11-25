import z from 'zod';

import { listOf } from '../../../../utils/query-list';
import { createSortableDto } from '../../../framework/sorting';
import { COURT_OF_CASSATION_POSITIONS } from '../../../shared/court-of-cassation-position.enum';
import { ALERT_DEADLINES, POSITION_ALERTS } from '../../domain/position-alert';
import { POSITION_STATUSES } from '../../domain/position-status';

const statusAndAlertFilters = {
  alerts: listOf(z.enum(POSITION_ALERTS)),
  deadlines: listOf(z.enum(ALERT_DEADLINES)),
  search: z.string().optional(),
  statuses: listOf(z.enum(POSITION_STATUSES)),
};

export class ListCourtOfAppealFirstPresidentsDto extends createSortableDto(
  z.object({
    ...statusAndAlertFilters,
    sortBy: z.enum(['court', 'installationDate', 'name', 'status']).optional(),
  }),
) {}

export class ListJudicialCourtPresidentsDto extends createSortableDto(
  z.object({
    ...statusAndAlertFilters,
    ressorts: listOf(z.string()),
    sortBy: z.enum(['court', 'installationDate', 'name', 'ressort', 'status']).optional(),
  }),
) {}

export class ListCourtOfCassationHoldersDto extends createSortableDto(
  z.object({
    ...statusAndAlertFilters,
    positions: listOf(z.enum(COURT_OF_CASSATION_POSITIONS)),
    sortBy: z.enum(['installationDate', 'name', 'status']).optional(),
  }),
) {}
