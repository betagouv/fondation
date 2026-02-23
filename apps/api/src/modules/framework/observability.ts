import { Inject, Injectable, Module } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request as ExpressRequest } from 'express';
import { assertIsDefined } from 'src/utils/is-defined';
import { API_CONFIG_TOKEN, ApiConfig } from './config';

@Injectable()
export class SentryService {
  private readonly isEnabled: boolean = false;
  constructor(@Inject(API_CONFIG_TOKEN) config: ApiConfig) {
    if (process.env.NODE_ENV !== 'production') return;

    const dsn = assertIsDefined(
      'sentryDsn' in config ? config.sentryDsn : undefined,
      'sentry DSN in not available',
    );

    this.isEnabled = true;
    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
      release: `${process.env.npm_package_name}@${process.env.npm_package_version}`,
      environment: process.env.DEPLOY_ENV,
    });
  }

  captureException(
    exception: unknown,
    request: ExpressRequest,
    status: number,
  ): void {
    if (!this.isEnabled) return;

    const { url, body, headers, method } = request;
    Sentry.withScope((scope) => {
      scope.setTags({ url });
      scope.setExtras({ method, headers, body, status });
      if (request?.userId) {
        scope.setUser({
          id: request.userId,
        });
      }

      Sentry.captureException(exception);
    });
  }
}

@Module({ providers: [SentryService], exports: [SentryService] })
export class ObservabilityModule {}
