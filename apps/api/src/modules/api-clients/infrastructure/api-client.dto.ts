import { createZodDto } from 'nestjs-zod';
import z from 'zod';

/** The names are those of the OAuth 2.0 client credentials grant (RFC 6749, §4.4) */
export class AuthenticateApiClientDto extends createZodDto(
  z.object({
    client_id: z.string(),
    client_secret: z.string(),
    grant_type: z.literal('client_credentials'),
  }),
) {}

export class AuthenticatedApiClientDto extends createZodDto(
  z.object({
    access_token: z.string().meta({ description: 'Sent as `Authorization: Bearer <access_token>`' }),
    token_type: z.literal('Bearer'),
    expires_in: z.number().meta({ description: 'Seconds before the token stops working' }),
  }),
) {}

export class AuthenticateApiClientRefusedDto extends createZodDto(
  z.object({
    error: z.enum(['invalid_client', 'access_denied']).meta({
      description:
        '- `invalid_client` (401): unknown or revoked identifier, or wrong secret\n' +
        '- `access_denied` (403): the request does not come from an allowed IP',
    }),
  }),
) {}
