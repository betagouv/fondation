import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PrismaUserTitleEnum } from 'src/generated/prisma/enums';

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

export class UpdateMemberTitleDto extends createZodDto(
  z.object({
    title: z.enum([PrismaUserTitleEnum.PRESIDENT_PARQUET, PrismaUserTitleEnum.PRESIDENT_SIEGE]).nullable(),
  }),
) {}
