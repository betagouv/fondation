import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { API_CONFIG } from './shared-kernel/adapters/primary/nestjs/tokens';
import { ApiConfig } from './shared-kernel/adapters/primary/zod/api-config-schema';
import { HttpExceptionFilter } from './shared-kernel/adapters/primary/nestjs/filters/htt-exception.filter';

export class MainAppConfigurator {
  app: INestApplication;

  constructor(app: INestApplication) {
    this.app = app;
  }

  withCors(): MainAppConfigurator {
    const apiConfig = this.app.get<ApiConfig>(API_CONFIG);
    this.app.enableCors({
      origin: apiConfig.originUrl,
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
    this.app.useGlobalFilters(new HttpExceptionFilter());
    return this;
  }

  configure(): INestApplication {
    return this.app;
  }
}
