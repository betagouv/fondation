import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { COMMENT_MAX_LENGTH } from '../../../utils/comment';
import { typedDateSchema } from '../../../utils/date-only';
import { listOf } from '../../../utils/query-list';
import { CALL_FOR_APPLICATIONS_STATUSES, TARGET_JURISDICTION_TYPES } from '../domain/call-for-applications';
import { CALL_FOR_APPLICATIONS_PERIODS } from '../domain/call-for-applications-period';

export class CreateCallForApplicationsDto extends createZodDto(
  z.object({
    comment: z.string().max(COMMENT_MAX_LENGTH).nullish(),
    deadline: typedDateSchema.nullish(),
    publishedOn: typedDateSchema.nullish(),
    targetJurisdictionType: z.enum(TARGET_JURISDICTION_TYPES),
    type: z.literal('GENERAL'),
  }),
) {}

export class ListCallsForApplicationsDto extends createZodDto(
  z.object({
    period: z.enum(CALL_FOR_APPLICATIONS_PERIODS),
    statuses: listOf(z.enum(CALL_FOR_APPLICATIONS_STATUSES)),
    targetJurisdictionTypes: listOf(z.enum(TARGET_JURISDICTION_TYPES)),
    years: listOf(
      z
        .string()
        .regex(/^\d{4}$/)
        .transform(Number),
    ),
  }),
) {}

export class CreatedCallForApplicationsDto extends createZodDto(z.object({ id: z.uuid() })) {}
