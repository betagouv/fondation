import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { dateOnlyJsonSchema } from 'src/utils/date-only';
import { timeOnlySchema } from 'src/utils/time-only';

export class CreatedJusticePresentationPlanDto extends createZodDto(z.object({ id: z.string() })) {}

export class CreateOrUpdateJusticePresentationPlanDto extends createZodDto(
  z.object({
    date: dateOnlyJsonSchema,
    time: timeOnlySchema,
    endingTime: timeOnlySchema.nullish(),
    chairmanId: z.string(),
    secretaryId: z.string(),
    justiceContactId: z.string(),
    absentMembers: z.array(z.string()),
    hasRenunciation: z.boolean(),
    agendas: z.array(
      z.object({
        id: z.string(),
        comment: z.string().trim().nonempty().nullable(),
      }),
    ),
  }),
) {}

export class PresentPlanDto extends createZodDto(
  z.object({
    endTime: timeOnlySchema,
  }),
) {}
