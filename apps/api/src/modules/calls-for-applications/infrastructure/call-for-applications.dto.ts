import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { COMMENT_MAX_LENGTH } from '../../../utils/comment';
import { typedDateSchema } from '../../../utils/date-only';
import { TARGET_JURISDICTION_TYPES } from '../domain/call-for-applications';

export class CreateCallForApplicationsDto extends createZodDto(
  z.object({
    comment: z.string().max(COMMENT_MAX_LENGTH).nullish(),
    deadline: typedDateSchema.nullish(),
    publishedOn: typedDateSchema.nullish(),
    targetJurisdictionType: z.enum(TARGET_JURISDICTION_TYPES),
    type: z.literal('GENERAL'),
  }),
) {}

export class CreatedCallForApplicationsDto extends createZodDto(z.object({ id: z.uuid() })) {}
