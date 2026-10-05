import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { MAX_LABEL_LENGTH } from '../../domain/magistrat-phone-numbers';

export class SearchMagistratsQueryDto extends createZodDto(
  z.object({
    search: z.string().min(2).optional(),
    ignore: z
      .string()
      .optional()
      .transform((x) => (x ?? '').split(',').filter((x) => !!x))
      .pipe(z.array(z.uuid())),
  }),
) {}

export class AddMagistratPhoneNumberDto extends createZodDto(
  z.object({
    label: z
      .string()
      .trim()
      .max(MAX_LABEL_LENGTH)
      .nullable()
      .transform((label) => label || null),
    number: z.string(),
  }),
) {}

export class UpdateMagistratPhoneNumberDto extends createZodDto(
  z.object({
    label: z
      .string()
      .trim()
      .max(MAX_LABEL_LENGTH)
      .nullable()
      .transform((label) => label || null),
    number: z.string(),
  }),
) {}
