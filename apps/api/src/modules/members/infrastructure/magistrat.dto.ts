import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export class SearchMagistratAuthorizationDto extends createZodDto(z.object({ email: z.email() })) {}

export class SearchMagistratAuthorizationUnauthorizedDto extends createZodDto(
  z.object({
    message: z.string(),
    path: z.string(),
    statusCode: z.literal(401),
    timestamp: z.iso.datetime({ local: false }),
  }),
) {}

export class SearchMagistratAuthorizationInvalidEmailDto extends createZodDto(
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
