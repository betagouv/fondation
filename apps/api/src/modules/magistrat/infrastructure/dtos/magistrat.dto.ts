import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export class SearchMagistratsQueryDto extends createZodDto(
  z.object({
    search: z.string().min(2).optional(),
    ignore: z
      .string()
      .optional()
      .transform((x) => (x ?? '').split(',').filter((x) => !!x))
      .pipe(z.array(z.uuid())),
  }),
) {}
