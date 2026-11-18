import {
  BadRequestException,
  Catch,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { ApiClientForbidden, ApiClientUnauthenticated } from '../domain/api-client';

/**
 * The errors of the token route alone follow OAuth 2.0 (RFC 6749, §5.2), which the partner's library expects: the
 * other routes keep the error format of Fondation
 */
@Catch(ApiClientForbidden, ApiClientUnauthenticated, BadRequestException)
export class OAuthErrorFilter implements ExceptionFilter {
  catch(
    exception: ApiClientForbidden | ApiClientUnauthenticated | BadRequestException,
    host: ArgumentsHost,
  ): void {
    const http = host.switchToHttp();
    const [status, error] = OAuthErrorFilter.answer(exception, http.getRequest<ExpressRequest>());

    http.getResponse<ExpressResponse>().status(status).json({ error });
  }

  private static answer(
    exception: ApiClientForbidden | ApiClientUnauthenticated | BadRequestException,
    request: ExpressRequest,
  ): [HttpStatus, string] {
    if (exception instanceof ApiClientUnauthenticated) return [HttpStatus.UNAUTHORIZED, 'invalid_client'];
    if (exception instanceof ApiClientForbidden) return [HttpStatus.FORBIDDEN, 'access_denied'];

    const grantType: unknown = (request.body as Record<string, unknown> | undefined)?.grant_type;

    return [
      HttpStatus.BAD_REQUEST,
      typeof grantType === 'string' && grantType !== 'client_credentials'
        ? 'unsupported_grant_type'
        : 'invalid_request',
    ];
  }
}
