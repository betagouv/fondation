import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { COMMENT_MAX_LENGTH } from '../../../../utils/comment';
import { TYPED_DATE_RANGE } from '../../../../utils/date-only';
import { COURT_OF_CASSATION_POSITIONS } from '../../../shared/court-of-cassation-position.enum';
import {
  CALL_FOR_APPLICATIONS_TYPES,
  callForApplicationsTypeOptionOf,
  targetPositionOf,
} from '../../domain/call-for-applications';
import { callForApplicationsTypeSchema, targetPositionSchema } from '../call-for-applications.dto';

@Injectable()
export class FindCallForApplicationsFormQuery {
  handle(): FoundCallForApplicationsFormDto {
    return {
      commentMaxLength: COMMENT_MAX_LENGTH,
      dateRange: TYPED_DATE_RANGE,
      targetPositions: COURT_OF_CASSATION_POSITIONS.map(targetPositionOf),
      types: CALL_FOR_APPLICATIONS_TYPES.map(callForApplicationsTypeOptionOf),
    };
  }
}

export class FoundCallForApplicationsFormDto extends createZodDto(
  z.object({
    commentMaxLength: z.number().int(),
    dateRange: z.object({ max: z.iso.date(), min: z.iso.date() }),
    targetPositions: z.array(targetPositionSchema),
    /** each type with the hint shown under the field and whether positions must be picked */
    types: z.array(
      callForApplicationsTypeSchema.extend({ scope: z.string(), targetPositionsRequired: z.boolean() }),
    ),
  }),
) {}
