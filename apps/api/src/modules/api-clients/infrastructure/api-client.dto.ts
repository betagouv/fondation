import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { API_SCOPES, ROTATION_DAYS } from '../domain/api-client';

export class CreateApiClientDto extends createZodDto(
  z.object({
    name: z.string().trim().min(1).max(100),
    // without any IP or any route, the client would be refused everything and its secret shown for nothing. Each IP is
    // checked by the domain, which names the wrong one
    allowedIps: z
      .array(z.object({ ip: z.string().trim().max(64) }))
      .min(1)
      .max(20),
    scopes: z
      .array(z.object({ id: z.enum(API_SCOPES) }))
      .min(1)
      .max(API_SCOPES.length),
  }),
) {}

export class CreatedApiClientDto extends createZodDto(
  z.object({
    id: z.string().meta({ description: 'The `client_id` handed to the partner' }),
    secret: z.string().meta({ description: 'Shown this once: Fondation keeps its hash only' }),
  }),
) {}

/** The whole configuration, which replaces the previous one */
export class UpdateApiClientDto extends createZodDto(
  z.object({
    // each IP is checked by the domain, which names the wrong one. The bounds of the limits are the domain's too,
    // ApiClientNotUpdatable('limit') tells them
    allowedIps: z
      .array(z.object({ ip: z.string().trim().max(64) }))
      .max(20)
      .meta({ description: 'Without any, the client is refused from everywhere' }),
    authLimitPerMinute: z.number().int(),
    scopes: z
      .array(z.object({ id: z.enum(API_SCOPES), limitPerMinute: z.number().int() }))
      .max(API_SCOPES.length),
  }),
) {}

export class RotateApiClientSecretDto extends createZodDto(
  z.object({
    // the bounds are the domain's, ApiClientNotRotatable('days') tells them
    days: z
      .number()
      .int()
      .optional()
      .meta({
        description: `How long the replaced secret stays valid, ${ROTATION_DAYS.default} days by default`,
      }),
  }),
) {}

export class RotatedApiClientSecretDto extends createZodDto(
  z.object({
    secret: z.string().meta({ description: 'Shown this once, like the first one' }),
    previousSecretValidUntil: z.iso.datetime(),
  }),
) {}

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
    error: z
      .enum(['invalid_request', 'unsupported_grant_type', 'invalid_client', 'access_denied', 'slow_down'])
      .meta({
        description:
          '- `invalid_request` (400): a parameter is missing\n' +
          '- `unsupported_grant_type` (400): the grant is not `client_credentials`\n' +
          '- `invalid_client` (401): unknown or revoked identifier, or wrong secret\n' +
          '- `access_denied` (403): the request does not come from an allowed IP\n' +
          '- `slow_down` (429): too many requests within the minute, `Retry-After` tells how many seconds to wait',
      }),
  }),
) {}
