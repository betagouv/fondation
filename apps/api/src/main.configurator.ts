import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { API_CONFIG_TOKEN, ApiConfig } from './modules/framework/config';
import { HttpExceptionFilter } from './modules/framework/exception';
import { SentryService } from './modules/framework/observability';

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
    return this;
  }

  withFilters(): MainAppConfigurator {
    const sentry = this.app.get(SentryService);
    this.app.useGlobalFilters(new HttpExceptionFilter(sentry));
    return this;
  }

  configure(): INestApplication {
    return this.app;
  }
}
