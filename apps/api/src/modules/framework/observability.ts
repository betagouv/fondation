import { createHmac } from 'node:crypto';

import { Inject, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request as ExpressRequest, IRoute } from 'express';

import * as time from '../../utils/time';

import { API_CONFIG_TOKEN, ApiConfig } from './config';
import { RequestEvent } from './request-event';

export const SENTRY_FLUSH_TIMEOUT = 5 * time.SECONDS;

// Every key is set: as soon as dataCollection is given, the missing ones collect everything, cookies and bodies included.
// The HTTP server of the SDK 10.76 ignores httpBodies and still reads the incoming body unless told otherwise
export const WITHOUT_PERSONAL_DATA = {
  // TODO: see apps/client/src/observability.ts
  dataCollection: {
    cookies: false,
    databaseQueryData: false,
    frameContextLines: 7,
    genAI: { inputs: false, outputs: false },
    graphQL: { document: true, variables: false },
    httpBodies: [],
    httpHeaders: false,
    stackFrameVariables: false,
    urlQueryParams: false,
    userInfo: false,
  },
  integrations: [Sentry.httpIntegration({ maxIncomingRequestBodySize: 'none' })],
} satisfies Sentry.NodeOptions;

/**
 * What Sentry gets in place of an address, an IP or a browser, to tell them apart without revealing them. Keyed, because
 * a plain hash of an IPv4 is reversed by trying them all
 */
export function pseudonymize(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

@Injectable()
export class SentryService implements OnApplicationShutdown {
  private readonly isEnabled: boolean = false;
  constructor(@Inject(API_CONFIG_TOKEN) config: ApiConfig) {
    if (!config.isProduction) return;

    this.isEnabled = !!config.sentryDsn;
  }

  // The SDK sends its buffered logs on beforeExit, which never comes: Nest kills the process with the signal again
  async onApplicationShutdown(): Promise<void> {
    if (this.isEnabled) await Sentry.flush(SENTRY_FLUSH_TIMEOUT);
  }

  captureException(exception: unknown, request: ExpressRequest, status: number): void {
    if (!this.isEnabled) return;

    const { route, method } = request;
    Sentry.withScope((scope) => {
      scope.setTags({ url: (route as IRoute).path });
      scope.setExtras({ method, status });
      if (request.user?.type === 'human') scope.setUser({ id: request.user.id });

      Sentry.captureException(exception);
    });
  }
}

@Module({
  exports: [RequestEvent, SentryService],
  providers: [RequestEvent, SentryService],
})
export class ObservabilityModule {}
