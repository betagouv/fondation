import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  Module,
  NestInterceptor,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  IRoute,
} from 'express';
import { Observable, tap } from 'rxjs';

import * as time from 'src/utils/time';
import { API_CONFIG_TOKEN, ApiConfig } from './config';

@Injectable()
export class SentryService {
  private readonly isEnabled: boolean = false;
  constructor(@Inject(API_CONFIG_TOKEN) config: ApiConfig) {
    if (!config.isProduction) return;

    this.isEnabled = !!config.sentryDsn;
  }

  captureException(
    exception: HttpException,
    request: ExpressRequest,
    status: number,
  ): void {
    if (!this.isEnabled) return;

    const { route, body, headers, method } = request;
    Sentry.withScope((scope) => {
      scope.setTags({ url: (route as IRoute).path });
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

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  private readonly isEnabled: boolean;
  constructor(@Inject(API_CONFIG_TOKEN) config: ApiConfig) {
    this.isEnabled = !!config.sentryDsn;
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    if (context.getType() !== 'http' || !this.isEnabled) return next.handle();

    const start = performance.now();
    return next.handle().pipe(
      tap({
        next: () => {
          this.observeRequest(start, context);
        },

        error: (err) => {
          this.observeRequest(start, context, err);
        },
      }),
    );
  }

  private observeRequest(
    start: number,
    ctx: ExecutionContext,
    error?: unknown,
  ): void {
    const http = ctx.switchToHttp();
    const req = http.getRequest<ExpressRequest>();
    const res = http.getResponse<ExpressResponse>();

    const durationMs = performance.now() - start;
    const durationSeconds = durationMs / time.SECONDS;

    let errorType: string | undefined = undefined;
    if (error instanceof HttpException && error.cause instanceof Error) {
      errorType = error.cause.constructor.name;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'constructor' in error &&
      typeof error.constructor === 'function'
    ) {
      errorType = error.constructor.name;
    }

    /** @see https://github.com/open-telemetry/semantic-conventions/blob/v1.27.0/docs/http/http-metrics.md#metric-httpserverrequestduration */
    Sentry.metrics.distribution(
      'http.server.request.duration',
      durationSeconds,
      {
        unit: 's',
        attributes: {
          'url.scheme': req.protocol,
          'network.protocol.version': req.httpVersion,
          'http.request.method': req.method.toUpperCase(),
          'http.response.status_code': res.statusCode,
          'http.route': (req.route as IRoute).path,
          'error.type': errorType,
        },
      },
    );
  }
}

@Module({
  exports: [SentryService],
  providers: [
    SentryService,
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
  ],
})
export class ObservabilityModule {}
