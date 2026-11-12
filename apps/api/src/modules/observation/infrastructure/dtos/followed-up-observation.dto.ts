import z from 'zod';

import { dateOnlyJsonSchema } from '../../../../utils/date-only';
import { createPaginatedZodDto } from '../../../framework/pagination';
import { createSortableDto } from '../../../framework/sorting';
import { SESSION_STATUSES } from '../../../session/transparence/infrastructure/finders/session-statuses.finder';

import {
  followUpsFilterSchema,
  ListedSessionObservationSchema,
  observantSearchSchema,
} from './session-observation.dto';

export class ListFollowedUpObservationsQueryDto extends createSortableDto(
  z.object({
    followUps: followUpsFilterSchema,
    search: observantSearchSchema,
    sessionStatuses: z
      .string()
      .optional()
      .meta({ example: 'ONGOING,REPORTED' })
      .transform((value) =>
        (value ?? '')
          .split(',')
          .map((status) => status.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.enum(SESSION_STATUSES))),
    sortBy: z.enum(['dateReception', 'session']).optional(),
  }),
) {}

export class ListedFollowedUpObservationsDto extends createPaginatedZodDto(
  z.object({
    observation: ListedSessionObservationSchema,
    session: z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(SESSION_STATUSES),
      date: dateOnlyJsonSchema,
    }),
  }),
) {}
