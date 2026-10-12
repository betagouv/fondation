import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export class PreparedOpenIdRequestDto extends createZodDto(
  z.object({
    url: z.url(),
  }),
) {}

export class OpenIdCallbackQueryDto extends createZodDto(
  z.object({
    state: z.base64url(),
    code: z.string().trim().nonempty(),
  }),
) {}
