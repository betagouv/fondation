import { Inject, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';

import { API_CONFIG_TOKEN, ApiConfig } from '../../framework/config';
import { pseudonymize } from '../../framework/observability';
import { ApiClientForbidden, canonicalIp } from '../domain/api-client';

/**
 * Warns Sentry of the refusals of the public API that point to an abuse or a leaked secret. One issue per client, or
 * per IP, and per cause: under a single one, an alert rule on new issues would only notify the first
 * (see SimpleAuthService.reportCrossedThresholds)
 */
@Injectable()
export class ApiClientAlerts {
  constructor(@Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig) {}

  /**
   * A known client, with a right secret or token, from an IP or for a route it was not registered for. One issue per
   * IP or per route, so that a secret used from a second IP notifies too, and once a minute at most for each
   */
  forbidden(refusal: {
    clientId: string;
    ip: string;
    reason: ApiClientForbidden['reason'];
    route: string;
  }): void {
    const ipHash = this.ipHash(refusal.ip);

    Sentry.captureMessage('API client forbidden', {
      extra: { reason: refusal.reason, route: refusal.route },
      fingerprint: [
        'api-client-forbidden',
        refusal.clientId,
        refusal.reason === 'ip' ? ipHash : refusal.route,
      ],
      level: 'warning',
      tags: { 'api_client.id': refusal.clientId, 'client.ip_hash': ipHash },
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
    const ipHash = this.ipHash(refused.ip);

    Sentry.captureMessage('API refusals limited', {
      extra: { limit: refused.limit },
      fingerprint: ['api-refusals-limited', ipHash],
      level: 'warning',
      tags: { 'client.ip_hash': ipHash },
    });
  }

  /** Searchable as a tag: links the refusals of a same IP across the issues */
  private ipHash(ip: string): string {
    return pseudonymize(canonicalIp(ip) ?? ip, this.config.cookieSecret);
  }
}
