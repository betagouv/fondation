import { type INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { RootModule } from './modules/root.module';
import { API_CONFIG_TOKEN, type ApiConfig } from './modules/framework/config';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './modules/framework/exception';
import { SentryService } from './modules/framework/observability';
import { openapi } from './modules/framework/openapi';

@Module({ imports: [RootModule] })
export class AppModule {
  static async create(): Promise<INestApplication> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    const config = app.get<ApiConfig>(API_CONFIG_TOKEN);

    app.disable('x-powered-by');
    app.enableCors({ origin: config.frontendOriginUrl, credentials: true });
    app.use(cookieParser(config.cookieSecret));
    app.useGlobalFilters(new HttpExceptionFilter(app.get(SentryService)));
    app.enableShutdownHooks();

    if (!config.isProduction) {
      openapi(app);
    }

    return app;
  }

  static async listen(): Promise<void> {
    const app = await AppModule.create();
    const config = app.get(API_CONFIG_TOKEN);
    return app.listen(config.port);
  }
}
