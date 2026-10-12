import { type INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

import { API_CONFIG_TOKEN, type ApiConfig } from './modules/framework/config';
import { openapi } from './modules/framework/openapi';
import { RootModule } from './modules/root.module';

@Module({ imports: [RootModule] })
export class AppModule {
  static async create(): Promise<INestApplication> {
    return this.configure(await NestFactory.create<NestExpressApplication>(AppModule));
  }

  static configure(app: NestExpressApplication): NestExpressApplication {
    const config = app.get<ApiConfig>(API_CONFIG_TOKEN);

    app.disable('x-powered-by');
    app.enableCors({
      exposedHeaders: ['Content-Disposition'],
      origin: config.frontendOriginUrl,
      credentials: true,
    });
    app.use(cookieParser(config.cookieSecret));
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
