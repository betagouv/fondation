import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { COMMENT_MAX_LENGTH } from '../../../../utils/comment';
import { TYPED_DATE_RANGE } from '../../../../utils/date-only';
import {
  CALL_FOR_APPLICATIONS_TYPES,
  callForApplicationsTypeScopeOf,
} from '../../domain/call-for-applications';
import { callForApplicationsTypeSchema } from '../call-for-applications.dto';

@Injectable()
export class FindCallForApplicationsFormQuery {
  handle(): FoundCallForApplicationsFormDto {
    return {
      commentMaxLength: COMMENT_MAX_LENGTH,
      dateRange: TYPED_DATE_RANGE,
      types: CALL_FOR_APPLICATIONS_TYPES.map(callForApplicationsTypeScopeOf),
    };
  }
}

export class FoundCallForApplicationsFormDto extends createZodDto(
  z.object({
    commentMaxLength: z.number().int(),
    dateRange: z.object({ max: z.iso.date(), min: z.iso.date() }),
    /** with what each one targets, shown under the field */
    types: z.array(callForApplicationsTypeSchema.extend({ scope: z.string() })),
  }),
) {}
