import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

export class MainAppConfigurator {
  app: INestApplication;

  constructor(app: INestApplication) {
    this.app = app;
  }

  withCors(): MainAppConfigurator {
    this.app.enableCors();
    return this;
  }
  withCookies(): MainAppConfigurator {
    this.app.use(cookieParser());
    return this;
  }

  configure(): INestApplication {
    return this.app;
  }
}
