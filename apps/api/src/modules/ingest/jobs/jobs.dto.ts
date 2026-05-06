import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaJobStatusEnum } from 'src/generated/prisma/enums';

export class ListJobsQueryDto extends createZodDto(
  z.object({
    statuses: z.preprocess(
      (x) => (x ? ([] as unknown[]).concat(x) : x),
      z.array(z.enum(PrismaJobStatusEnum)).optional(),
    ),
  }),
) {}
