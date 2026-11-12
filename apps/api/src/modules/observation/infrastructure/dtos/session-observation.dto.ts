import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema } from '../../../../utils/date-only';
import { createPaginatedZodDto } from '../../../framework/pagination';
import { createSortableDto } from '../../../framework/sorting';
import { ObservationFollowUp } from '../../domain/observation-follow-up';

export const followUpsFilterSchema = z
  .string()
  .optional()
  .meta({ example: 'null,ALERT' })
  .transform((value) =>
    (value ?? '').split(',').flatMap((followUp) => {
      const trimmed = followUp.trim();
      if (trimmed === 'null') return [null];
      return trimmed ? [trimmed] : [];
    }),
  )
  .pipe(z.array(z.enum(ObservationFollowUp.enum).nullable()));

export const observantSearchSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export class ListSessionObservationsQueryDto extends createSortableDto(
  z.object({
    followUps: followUpsFilterSchema,
    search: observantSearchSchema,
    sortBy: z.enum(['dateReception']).optional(),
  }),
) {}

export const ListedSessionObservationSchema = z.object({
  id: z.string(),
  dateReception: dateOnlyJsonSchema,
  followUp: z.enum(ObservationFollowUp.enum).nullable(),
  observant: z.object({
    id: z.string(),
    name: z.string(),
    currentPosition: z.string().nullable(),
  }),
  nominationFile: z.object({
    id: z.string(),
    number: z.number().int().nullable(),
    magistrat: z.object({
      // null until the proposed magistrat is detected in LOLFI
      id: z.string().nullable(),
      name: z.string(),
      grade: z.string().nullable(),
      currentPosition: z.string().nullable(),
    }),
    targeted: z.object({
      grade: z.string().nullable(),
      position: z.string().nullable(),
    }),
  }),
});

export class ListedSessionObservationsDto extends createPaginatedZodDto(ListedSessionObservationSchema) {}

export class CountedSessionObservationsDto extends createZodDto(z.object({ total: z.number().int() })) {}
