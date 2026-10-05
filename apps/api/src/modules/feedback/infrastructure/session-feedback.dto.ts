import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  DEBATE_CONTRIBUTIONS,
  MANUAL_WORK_SHARES,
  OTHER_TOOL_USAGES,
  REVIEW_THOROUGHNESSES,
} from '../domain/session-feedback';

const freeText = z
  .string()
  .trim()
  .max(2_000)
  .transform((text) => text || null)
  .nullable();

export class AnswerSessionFeedbackDto extends createZodDto(
  z.object({
    easeRating: z.int().min(1).max(5),
    hindrance: freeText,
    member: z
      .object({
        debateContribution: z.enum(DEBATE_CONTRIBUTIONS),
        manualWorkShare: z.enum(MANUAL_WORK_SHARES),
        reviewThoroughness: z.enum(REVIEW_THOROUGHNESSES),
      })
      .nullable(),
    satisfactionRating: z.int().min(1).max(10),
    secretariat: z
      .object({
        manualWorkShare: z.enum(MANUAL_WORK_SHARES),
        otherToolPurpose: freeText,
        otherToolUsage: z.enum(OTHER_TOOL_USAGES),
      })
      .nullable(),
  }),
) {}
