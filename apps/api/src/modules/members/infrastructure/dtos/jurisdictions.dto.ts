import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export class SearchJurisdictionQueryDto extends createZodDto(
  z.object({
    search: z
      .string()
      .trim()
      .optional()
      .transform((x = '') => (x.length > 0 ? x : undefined)),

    includeIds: z
      .string()
      .trim()
      .optional()
      .transform((value) => value?.split(',').map((x) => x.trim())),
  }),
) {}
