import { INestApplication } from '@nestjs/common';
import {
  type NextFunction,
  type Request as ExpressRequest,
  type Response as ExpressResponse,
} from 'express';
import cookieParser from 'cookie-parser';
import { SentryService } from 'src/shared-kernel/business-logic/gateways/services/sentry.service';
import { HttpExceptionFilter } from './shared-kernel/adapters/primary/nestjs/filters/http-exception.filter';
import { SENTRY_SERVICE } from './shared-kernel/adapters/primary/nestjs/tokens';
import { API_CONFIG_TOKEN, ApiConfig } from './modules/framework/config';

export class MainAppConfigurator {
  apiConfig: ApiConfig;

  constructor(readonly app: INestApplication) {
    this.apiConfig = this.app.get<ApiConfig>(API_CONFIG_TOKEN);
  }

  withCors(): MainAppConfigurator {
    this.app.enableCors({
      origin: this.apiConfig.frontendOriginUrl,
      credentials: true,
    });
    return this;
  }

  withCookies(secret?: string): MainAppConfigurator {
    this.app.use(cookieParser(secret ?? this.apiConfig.cookieSecret));
    if (process.env.NODE_ENV !== 'production') {
      // FIXME: temporary, remove once the custom signer is not used anymore
      this.app.use(
        (req: ExpressRequest, _res: ExpressResponse, next: NextFunction) => {
          if (!Object.keys(req.signedCookies).length && req.headers['cookie']) {
            req.signedCookies = { ...req.cookies };
          }

          next();
        },
      );
    }

    return this;
  }

  withFilters(): MainAppConfigurator {
    const sentry = this.app.get<SentryService>(SENTRY_SERVICE);
    this.app.useGlobalFilters(new HttpExceptionFilter(sentry));
    return this;
  }

  configure(): INestApplication {
    return this.app;
  }
}
