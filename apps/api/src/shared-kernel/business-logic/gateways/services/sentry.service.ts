import { HttpException } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request } from 'express';

export class SentryService {
  _canCapture: boolean = false;
  constructor(isEnabled: boolean, dsn: string) {
    if (isEnabled && dsn) {
      this.init(dsn);
    }
  }

  init(dsn: string) {
    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
    });
    this.canCapture = true;
  }

  captureException(exception: HttpException, request: Request, status: number) {
    if (!Sentry.getClient()) {
      return;
    }

    const { url, body, headers, method } = request;
    Sentry.withScope((scope) => {
      scope.setTag('url', url);
      scope.setExtra('method', method);
      scope.setExtra('headers', headers);
      scope.setExtra('body', body);
      scope.setExtra('status', status);

      if (request?.userId) {
        scope.setUser({
          id: request.userId,
        });
      }

      Sentry.captureException(exception);
    });
  }

  private set canCapture(canCapture: boolean) {
    this._canCapture = canCapture;
  }

  public get canCapture(): boolean {
    return this._canCapture;
  }
}
