import { HttpException, HttpStatus } from '@nestjs/common';
import { type Response as ExpressResponse } from 'express';

import { ApiClientRateLimited } from '../domain/rate-window';

/** The 429 of the public API, which tells in `Retry-After` how many seconds to wait */
export function tooManyRequests(response: ExpressResponse, error: ApiClientRateLimited): HttpException {
  response.setHeader('Retry-After', error.retryAfter);

  return new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
}
