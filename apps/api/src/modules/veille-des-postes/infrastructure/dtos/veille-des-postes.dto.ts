import z from 'zod';

import { createSortableDto } from '../../../framework/sorting';
import { COURT_OF_CASSATION_POSITIONS } from '../../domain/court-of-cassation-position';
import { ALERT_DEADLINES, POSITION_ALERTS } from '../../domain/position-alert';
import { POSITION_STATUSES } from '../../domain/position-status';

/** a single value in the query string comes as a string rather than an array */
function listOf<T extends z.ZodType>(item: T) {
  return z.preprocess((x) => (x ? ([] as unknown[]).concat(x) : x), z.array(item).optional());
}

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
