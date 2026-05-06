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

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  private readonly logger = new Logger(CatchEverythingFilter.name);

  constructor(@Optional() private readonly sentryService: SentryService | undefined) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<ExpressRequest>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    if (status >= 500) {
      this.logger.error('Error', exception);
      this.sentryService?.captureException(exception, request, status);
    }

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : {};

    ctx
      .getResponse<ExpressResponse>()
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
