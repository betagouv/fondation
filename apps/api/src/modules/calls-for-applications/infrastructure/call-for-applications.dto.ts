import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { COMMENT_MAX_LENGTH } from '../../../utils/comment';
import { typedDateSchema } from '../../../utils/date-only';
import { listOf } from '../../../utils/query-list';
import { createSortableDto } from '../../framework/sorting';
import { COURT_OF_CASSATION_POSITIONS } from '../../shared/court-of-cassation-position.enum';
import {
  CALL_FOR_APPLICATIONS_FIELDS,
  CALL_FOR_APPLICATIONS_STATUSES,
  CALL_FOR_APPLICATIONS_TYPES,
} from '../domain/call-for-applications';
import { CALL_FOR_APPLICATIONS_PERIODS } from '../domain/call-for-applications-period';
import { CALL_FOR_APPLICATIONS_SORTABLE_COLUMNS } from '../domain/call-for-applications-sorting';

export const callForApplicationsTypeSchema = z.object({
  id: z.enum(CALL_FOR_APPLICATIONS_TYPES),
  label: z.string(),
});
export const callForApplicationsStatusSchema = z.object({
  id: z.enum(CALL_FOR_APPLICATIONS_STATUSES),
  label: z.string(),
});
export const targetPositionSchema = z.object({ id: z.enum(COURT_OF_CASSATION_POSITIONS), label: z.string() });
export const callForApplicationsFieldSchema = z.object({
  id: z.enum(CALL_FOR_APPLICATIONS_FIELDS),
  label: z.string(),
});

/** every field of the form: an update replaces them all */
const callForApplicationsForm = z.object({
  comment: z.string().max(COMMENT_MAX_LENGTH).nullish(),
  deadline: typedDateSchema.nullish(),
  publishedOn: typedDateSchema.nullish(),
  targetPositions: z
    .array(z.enum(COURT_OF_CASSATION_POSITIONS))
    .max(COURT_OF_CASSATION_POSITIONS.length)
    .nullish(),
  type: z.enum(CALL_FOR_APPLICATIONS_TYPES),
});

export class CreateCallForApplicationsDto extends createZodDto(callForApplicationsForm) {}

export class UpdateCallForApplicationsDto extends createZodDto(callForApplicationsForm) {}

export class ListCallsForApplicationsDto extends createSortableDto(
  z.object({
    period: z.enum(CALL_FOR_APPLICATIONS_PERIODS),
    sortBy: z.enum(CALL_FOR_APPLICATIONS_SORTABLE_COLUMNS).optional(),
    statuses: listOf(z.enum(CALL_FOR_APPLICATIONS_STATUSES)),
    types: listOf(z.enum(CALL_FOR_APPLICATIONS_TYPES)),
    years: listOf(
      z
        .string()
        .regex(/^\d{4}$/)
        .transform(Number),
    ),
  }),
) {}

export class CreatedCallForApplicationsDto extends createZodDto(z.object({ id: z.uuid() })) {}
