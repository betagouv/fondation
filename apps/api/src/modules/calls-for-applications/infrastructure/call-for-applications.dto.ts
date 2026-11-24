import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { COMMENT_MAX_LENGTH } from '../../../utils/comment';
import { typedDateSchema } from '../../../utils/date-only';
import { listOf } from '../../../utils/query-list';
import { createSortableDto } from '../../framework/sorting';
import {
  CALL_FOR_APPLICATIONS_STATUSES,
  CALL_FOR_APPLICATIONS_TYPES,
  TARGET_JURISDICTION_TYPES,
} from '../domain/call-for-applications';
import { CALL_FOR_APPLICATIONS_PERIODS } from '../domain/call-for-applications-period';
import { CALL_FOR_APPLICATIONS_SORTABLE_COLUMNS } from '../domain/call-for-applications-sorting';

/** every field of the form: an update replaces them all */
const callForApplicationsForm = z.object({
  comment: z.string().max(COMMENT_MAX_LENGTH).nullish(),
  deadline: typedDateSchema.nullish(),
  publishedOn: typedDateSchema.nullish(),
  targetJurisdictionType: z.enum(TARGET_JURISDICTION_TYPES),
  type: z.enum(CALL_FOR_APPLICATIONS_TYPES),
});

export class CreateCallForApplicationsDto extends createZodDto(callForApplicationsForm) {}

export class UpdateCallForApplicationsDto extends createZodDto(callForApplicationsForm) {}

export class ListCallsForApplicationsDto extends createSortableDto(
  z.object({
    period: z.enum(CALL_FOR_APPLICATIONS_PERIODS),
    sortBy: z.enum(CALL_FOR_APPLICATIONS_SORTABLE_COLUMNS).optional(),
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
