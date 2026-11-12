import z from 'zod';

import { createSortableDto } from '../../../framework/sorting';
import { COURT_OF_CASSATION_POSITIONS } from '../../domain/court-of-cassation-position';
import { POSITION_STATUSES } from '../../domain/position-status';

export class ListCourtOfAppealFirstPresidentsDto extends createSortableDto(
  z.object({
    search: z.string().optional(),
    sortBy: z.enum(['court', 'installationDate', 'name']).optional(),
    statuses: z.preprocess(
      (x) => (x ? ([] as unknown[]).concat(x) : x),
      z.array(z.enum(POSITION_STATUSES)).optional(),
    ),
  }),
) {}

export class ListCourtOfCassationHoldersDto extends createSortableDto(
  z.object({
    positions: z.preprocess(
      (x) => (x ? ([] as unknown[]).concat(x) : x),
      z.array(z.enum(COURT_OF_CASSATION_POSITIONS)).optional(),
    ),
    search: z.string().optional(),
    sortBy: z.enum(['installationDate', 'name']).optional(),
    statuses: z.preprocess(
      (x) => (x ? ([] as unknown[]).concat(x) : x),
      z.array(z.enum(POSITION_STATUSES)).optional(),
    ),
  }),
) {}
