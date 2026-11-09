import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { createSortableDto } from '../../framework/sorting';
import { FEEDBACK_STATUSES } from '../domain/feedback';

export class SendFeedbackDto extends createZodDto(
  z.object({
    text: z.string().trim().min(1).max(2_000),
    // a path of Fondation only, as the admin opens it from the list: browsers read `//` and `/\` as another site
    url: z
      .string()
      .max(2_000)
      .regex(/^\/(?![/\\])/),
  }),
) {}

export class ChangeFeedbackStatusDto extends createZodDto(
  z.object({
    comment: z
      .string()
      .trim()
      .max(2_000)
      .transform((comment) => comment || null)
      .nullable(),
    status: z.enum(FEEDBACK_STATUSES),
  }),
) {}

export class ListFeedbacksQueryDto extends createSortableDto(
  z.object({
    sortBy: z.enum(['sentAt', 'status']).optional(),
    statuses: z.preprocess(
      (x) => (x ? ([] as unknown[]).concat(x) : x),
      z.array(z.enum(FEEDBACK_STATUSES)).optional(),
    ),
  }),
) {}
