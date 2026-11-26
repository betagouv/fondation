import {
  Catch,
  HttpException,
  Logger,
  Module,
  Optional,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { SentryService } from './observability';
import { RequestEvent } from './request-event';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  private readonly logger = new Logger(CatchEverythingFilter.name);

  constructor(
    // A union type would be emitted as Object: Nest would never find the provider
    @Optional() private readonly sentryService?: SentryService,
    @Optional() private readonly requestEvent?: RequestEvent,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<ExpressRequest>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    this.requestEvent?.failWith(exception, request);

    if (status >= 500) this.sentryService?.captureException(exception, request, status);

    const level: 'warn' | 'error' = status >= 500 ? 'error' : 'warn';
    this.logger[level](
      `${request.path} - ${status}`,
      exception instanceof Error && exception.cause !== undefined ? exception.cause : exception,
    );

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : {};
    ctx
      .getResponse<ExpressResponse>()
      // Nest sets the `@Header` of a route before running it: without this, its errors would be cached like its answers
      .setHeader('Cache-Control', 'no-store')
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...(typeof exceptionResponse === 'object' ? exceptionResponse : {}),
      });
  }
}

@Module({
  providers: [{ provide: APP_FILTER, useClass: CatchEverythingFilter }],
})
export class ExceptionModule {}
