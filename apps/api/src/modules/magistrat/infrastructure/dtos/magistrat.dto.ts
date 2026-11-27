import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { createSortableDto } from '../../../framework/sorting';

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
      .nullable()
      .transform((label) => label || null),
    number: z.string(),
  }),
) {}

export class InvalidMagistratEmailDto extends createZodDto(
  z.object({
    message: z.string(),
    path: z.string(),
    statusCode: z.literal(400),
    timestamp: z.iso.datetime({ local: false }),
    errors: z.array(
      z.object({
        code: z.literal('invalid_format'),
        format: z.literal('email'),
        message: z.string(),
        origin: z.string(),
        path: z.array(z.string()),
        pattern: z.string(),
      }),
    ),
  }),
) {}

export class AttachUnrecognisedMagistratEmailDto extends createZodDto(z.object({ magistratId: z.uuid() })) {}

export const UNRECOGNISED_MAGISTRAT_EMAILS_SORTABLE_COLUMNS = ['email', 'lastAttemptAt'] as const;

export class ListUnrecognisedMagistratEmailsDto extends createSortableDto(
  z.object({ sortBy: z.enum(UNRECOGNISED_MAGISTRAT_EMAILS_SORTABLE_COLUMNS).optional() }),
) {}
