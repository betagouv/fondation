import { Inject, Injectable, MiddlewareConsumer, Module, NestMiddleware, NestModule } from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';

import { API_CONFIG_TOKEN, type ApiConfig } from './config';

export const APP_VERSION_HEADER = 'X-App-Version';

@Injectable()
class AppVersionMiddleware implements NestMiddleware {
  constructor(@Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig) {}

  use(_req: Request, res: Response, next: NextFunction): void {
    if (this.config.appVersion) res.setHeader(APP_VERSION_HEADER, this.config.appVersion);
    next();
  }
}

@Module({})
export class AppVersionModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppVersionMiddleware).forRoutes('*all');
  }
}
