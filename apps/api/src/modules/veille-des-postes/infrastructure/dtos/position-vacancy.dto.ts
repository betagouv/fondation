import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { attachmentFiles } from '../../../framework/files';
import { REASON_DETAIL_MAX_LENGTH, VACANCY_REASONS } from '../../domain/position-vacancy';

export class DeclarePositionVacancyDto extends createZodDto(
  z.object({
    files: attachmentFiles().optional(),
    form: z.object({
      reason: z.enum(VACANCY_REASONS),
      reasonDetail: z.string().max(REASON_DETAIL_MAX_LENGTH).nullish(),
      startDate: z.iso.date(),
    }),
  }),
) {}
