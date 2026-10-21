import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class ExcludeJurisdictionsDto extends createZodDto(
  z.object({ jurisdictionIds: z.array(z.string()) }),
) {}

export class UpdateMemberDisplayTitleDto extends createZodDto(
  z.object({
    displayTitle: z
      .string()
      .trim()
      .transform((s) => s.replace(/[\n\r]/g, ' ') || null)
      .nullable(),
  }),
) {}
