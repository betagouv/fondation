import { createHmac } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';

import { API_CONFIG_TOKEN, ApiConfig } from '../../framework/config';

/**
 * Warns Sentry of the refusals of the public API that point to an abuse or a leaked secret. One issue per client, or
 * per IP, and per cause: under a single one, an alert rule on new issues would only notify the first
 * (see SimpleAuthService.reportCrossedThresholds)
 */
@Injectable()
export class ApiClientAlerts {
  constructor(@Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig) {}

  /** A known client, with a right secret or token, from an IP or for a route it was not registered for */
  forbidden(refusal: { clientId: string; reason: 'ip' | 'scope'; route: string }): void {
    Sentry.captureMessage('API client forbidden', {
      extra: { reason: refusal.reason, route: refusal.route },
      fingerprint: ['api-client-forbidden', refusal.clientId, refusal.reason],
      level: 'warning',
      tags: { 'api_client.id': refusal.clientId },
    });
  }

  /** Once a minute at most: the first call over the limit of the client on this route */
  rateLimited(call: { clientId: string; limit: number; route: string }): void {
    Sentry.captureMessage('API client rate limited', {
      extra: { limit: call.limit, route: call.route },
      fingerprint: ['api-client-rate-limited', call.clientId, call.route],
      level: 'warning',
      tags: { 'api_client.id': call.clientId },
    });
  }

  /** Once a minute at most: the refusal that turns the IP away, after secrets or tokens were tried from it */
  refusalsLimited(refused: { ip: string; limit: number }): void {
    // Keyed, because a plain hash of an IPv4 is reversed by trying them all
    const ipHash = createHmac('sha256', this.config.cookieSecret).update(refused.ip).digest('base64url');

    Sentry.captureMessage('API refusals limited', {
      extra: { limit: refused.limit },
      fingerprint: ['api-refusals-limited', ipHash],
      level: 'warning',
    });
  }
}
