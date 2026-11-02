import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { createSortableDto } from '../../framework/sorting';
import { REMARK_STATUSES } from '../domain/remark';

export class SendRemarkDto extends createZodDto(
  z.object({
    text: z.string().trim().min(1).max(2_000),
    // a path of Fondation only, as the admin opens it from the list: browsers read `//` and `/\` as another site
    url: z
      .string()
      .max(2_000)
      .regex(/^\/(?![/\\])/),
  }),
) {}

export class ChangeRemarkStatusDto extends createZodDto(
  z.object({
    comment: z
      .string()
      .trim()
      .max(2_000)
      .transform((comment) => comment || null)
      .nullable(),
    status: z.enum(REMARK_STATUSES),
  }),
) {}

export class ListRemarksQueryDto extends createSortableDto(
  z.object({
    sortBy: z.enum(['sentAt', 'status']).optional(),
    statuses: z.preprocess(
      (x) => (x ? ([] as unknown[]).concat(x) : x),
      z.array(z.enum(REMARK_STATUSES)).optional(),
    ),
  }),
) {}
