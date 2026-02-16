import { type INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import z from 'zod';
import { fr } from 'zod/locales';
import { API_CONFIG_TOKEN, type ApiConfig } from './modules/framework/config';
import { HttpExceptionFilter } from './modules/framework/exception';
import { SentryService } from './modules/framework/observability';
import { openapi } from './modules/framework/openapi';
import { RootModule } from './modules/root.module';

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

    if (process.env.NODE_ENV !== 'production') {
      openapi(app);
    }

    z.config(fr());
    return app;
  }

  static async listen(port?: number | string): Promise<void> {
    const app = await AppModule.create();
    return app.listen(port ?? (process.env.PORT || 3_000));
  }
}
