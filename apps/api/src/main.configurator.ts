import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { SentryService } from 'src/shared-kernel/business-logic/gateways/services/sentry.service';
import { HttpExceptionFilter } from './shared-kernel/adapters/primary/nestjs/filters/http-exception.filter';
import {
  API_CONFIG,
  SENTRY_SERVICE,
} from './shared-kernel/adapters/primary/nestjs/tokens';
import { ApiConfig } from './shared-kernel/adapters/primary/zod/api-config-schema';

export class MainAppConfigurator {
  app: INestApplication;
  apiConfig: ApiConfig;
  sentryService: SentryService;

  constructor(app: INestApplication) {
    this.app = app;
    this.apiConfig = this.app.get<ApiConfig>(API_CONFIG);
    this.sentryService = this.app.get<SentryService>(SENTRY_SERVICE);
  }

  withCors(): MainAppConfigurator {
    this.app.enableCors({
      origin: this.apiConfig.originUrl,
      credentials: true,
    });
    return this;
  }

  withCookies(): MainAppConfigurator {
    // Parse Cookie header and populate req.cookies
    // with an object keyed by the cookie names.
    this.app.use(cookieParser());
    return this;
  }

  withFilters(): MainAppConfigurator {
    this.app.useGlobalFilters(new HttpExceptionFilter(this.sentryService));
    return this;
  }

  configure(): INestApplication {
    return this.app;
  }
}
