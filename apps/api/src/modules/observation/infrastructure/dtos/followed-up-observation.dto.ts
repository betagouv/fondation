import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema } from '../../../../utils/date-only';
import { createPaginatedZodDto } from '../../../framework/pagination';
import { createSortableDto } from '../../../framework/sorting';
import { SESSION_STATUSES } from '../../../session/transparence/infrastructure/finders/session-statuses.finder';
import { OBSERVATION_BLOCK_TRACKING_STATUSES } from '../../domain/observation-block';

import { ObservationBlockTrackingSchema } from './observation-block-tracking.dto';
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
    sessionYears: z
      .string()
      .optional()
      .meta({ example: '2025,2026' })
      .transform((value) =>
        (value ?? '')
          .split(',')
          .map((year) => year.trim())
          .filter(Boolean),
      )
      .pipe(
        z.array(
          z
            .string()
            .regex(/^\d{4}$/)
            .transform(Number),
        ),
      ),
    sortBy: z.enum(['dateReception']).optional(),
    trackingStatuses: z
      .string()
      .optional()
      .meta({ example: 'IN_PROGRESS' })
      .transform((value) =>
        (value ?? '')
          .split(',')
          .map((status) => status.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.enum(OBSERVATION_BLOCK_TRACKING_STATUSES))),
  }),
) {}

// most recent first
export class ListedFollowedUpObservationSessionYearsDto extends createZodDto(
  z.object({ items: z.array(z.object({ year: z.number().int() })) }),
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
    // shared by every observation of the bloc d'observations
    tracking: ObservationBlockTrackingSchema,
    // the files where the observant is proposed in a session published after the bloc
    laterPropositions: z.array(
      z.object({
        id: z.string(),
        number: z.number().int().nullable(),
        session: z.object({ id: z.string(), name: z.string(), date: dateOnlyJsonSchema }),
        targeted: z.object({ grade: z.string().nullable(), position: z.string().nullable() }),
      }),
    ),
  }),
) {}
