import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { createPaginatedZodDto } from 'src/modules/framework/pagination';
import { createSortableDto } from 'src/modules/framework/sorting';
import { auditionScheduleSchema } from 'src/utils/audition-schedule';

function toArray(value: unknown): undefined | unknown[] {
  if (value === undefined) return undefined;
  return ([] as unknown[]).concat(value);
}

export class ListSessionAuditionsQueryDto extends createSortableDto(
  z.object({
    reporterIds: z
      .preprocess(
        (value) => toArray(value)?.map((id) => (id === 'null' ? null : id)),
        z.array(z.uuid().nullable()).optional(),
      )
      .optional(),
    search: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
    sortBy: z.enum(['auditionDate']).optional(),
  }),
) {}

const ListedSessionAuditionSchema = z.object({
  audition: auditionScheduleSchema.nullable(),
  contact: z.object({ email: z.string().nullable(), phone: z.string().nullable() }).nullable(),
  id: z.string(),
  magistrat: z.object({
    currentPosition: z.string().nullable(),
    id: z.string().nullable(),
    name: z.string(),
  }),
  propositions: z.array(
    z.object({ label: z.string(), nominationFileId: z.string(), observationId: z.string().nullable() }),
  ),
  reporters: z.array(z.object({ firstName: z.string(), id: z.string(), lastName: z.string() })),
  role: z.enum(['OBSERVANT', 'PROPOSED']),
});

export class ListedSessionAuditionsDto extends createPaginatedZodDto(ListedSessionAuditionSchema) {}

export class CountedSessionAuditionsDto extends createZodDto(
  z.object({ scheduled: z.number().int(), toSchedule: z.number().int() }),
) {}
