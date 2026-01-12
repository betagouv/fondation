import { createZodDto } from 'nestjs-zod';
import { isDefined } from 'src/utils/is-defined';
import z from 'zod';

export class ListMembersQueryDto extends createZodDto(
  z.object({
    sortBy: z.enum(['firstName', 'lastName']).optional(),
    sortDirection: z.enum(['asc', 'desc']).default('asc').optional(),
    search: z.string().trim().optional(),
    formations: z.preprocess(
      (x) => (isDefined(x) ? ([] as unknown[]).concat(x) : x),
      z.array(z.enum(['SIEGE', 'PARQUET', 'COMMUN'])).optional(),
    ),
  }),
) {}
