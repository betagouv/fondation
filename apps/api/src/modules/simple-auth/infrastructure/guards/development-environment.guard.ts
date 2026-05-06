import { CanActivate, ExecutionContext, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';

@Injectable()
export class DevelopmentEnvironmentGuard implements CanActivate {
  constructor(@Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig) {}

  canActivate(ctx: ExecutionContext) {
    if (this.config.isProduction || !this.config.e2eApiToken) {
      throw new NotFoundException();
    }

    const req = ctx.switchToHttp().getRequest<ExpressRequest>();
    const authorization = req.header('authorization') ?? '';
    if (!authorization.toLowerCase().startsWith('bearer ')) {
      throw new NotFoundException();
    }

    const token = authorization.split(' ', 2)[1];
    if (this.config.e2eApiToken !== token) {
      throw new NotFoundException();
    }

    return true;
  }
}
