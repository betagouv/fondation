import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { COMMENT_MAX_LENGTH } from '../../../../utils/comment';
import { TYPED_DATE_RANGE } from '../../../../utils/date-only';
import {
  CALL_FOR_APPLICATIONS_TYPES,
  callForApplicationsTypeOf,
  TARGET_JURISDICTION_TYPES,
  targetJurisdictionTypeOf,
} from '../../domain/call-for-applications';
import { callForApplicationsTypeSchema, targetJurisdictionTypeSchema } from '../call-for-applications.dto';

@Injectable()
export class FindCallForApplicationsFormQuery {
  handle(): FoundCallForApplicationsFormDto {
    return {
      commentMaxLength: COMMENT_MAX_LENGTH,
      dateRange: TYPED_DATE_RANGE,
      targetJurisdictionTypes: TARGET_JURISDICTION_TYPES.map(targetJurisdictionTypeOf),
      types: CALL_FOR_APPLICATIONS_TYPES.map(callForApplicationsTypeOf),
    };
  }
}

export class FoundCallForApplicationsFormDto extends createZodDto(
  z.object({
    commentMaxLength: z.number().int(),
    dateRange: z.object({ max: z.iso.date(), min: z.iso.date() }),
    targetJurisdictionTypes: z.array(targetJurisdictionTypeSchema),
    types: z.array(callForApplicationsTypeSchema),
  }),
) {}
