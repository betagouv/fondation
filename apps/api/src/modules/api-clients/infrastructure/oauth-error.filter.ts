import {
  BadRequestException,
  Catch,
  HttpStatus,
  Optional,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { WideEvent } from '../../framework/wide-event';
import { ApiClientForbidden, ApiClientUnauthenticated } from '../domain/api-client';
import { ApiClientRateLimited } from '../domain/rate-window';

type TokenRouteError =
  | ApiClientForbidden
  | ApiClientRateLimited
  | ApiClientUnauthenticated
  | BadRequestException;

/**
 * The errors of the token route alone follow OAuth 2.0 (RFC 6749, §5.2), which the partner's library expects: the
 * other routes keep the error format of Fondation
 */
@Catch(ApiClientForbidden, ApiClientRateLimited, ApiClientUnauthenticated, BadRequestException)
export class OAuthErrorFilter implements ExceptionFilter {
  constructor(@Optional() private readonly wideEvent?: WideEvent) {}

  catch(exception: TokenRouteError, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<ExpressRequest>();
    const response = http.getResponse<ExpressResponse>();
    const [status, error] = OAuthErrorFilter.answer(exception, request);
    this.wideEvent?.failWith(exception, request);

    if (exception instanceof ApiClientRateLimited) response.setHeader('Retry-After', exception.retryAfter);
    response.status(status).json({ error });
  }

  private static answer(exception: TokenRouteError, request: ExpressRequest): [HttpStatus, string] {
    if (exception instanceof ApiClientUnauthenticated) return [HttpStatus.UNAUTHORIZED, 'invalid_client'];
    if (exception instanceof ApiClientForbidden) return [HttpStatus.FORBIDDEN, 'access_denied'];
    // RFC 6749 names no error for a rate limit: this one is what RFC 8628 answers to a client asking too often
    if (exception instanceof ApiClientRateLimited) return [HttpStatus.TOO_MANY_REQUESTS, 'slow_down'];

    const grantType: unknown = (request.body as Record<string, unknown> | undefined)?.grant_type;

    return [
      HttpStatus.BAD_REQUEST,
      typeof grantType === 'string' && grantType !== 'client_credentials'
        ? 'unsupported_grant_type'
        : 'invalid_request',
    ];
  }
}
