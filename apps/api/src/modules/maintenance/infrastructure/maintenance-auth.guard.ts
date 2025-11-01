import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';

@Injectable()
export class MaintenanceAuthGuard implements CanActivate {
  private readonly maintenanceToken: string | undefined;

  constructor(@Inject(API_CONFIG_TOKEN) config: ApiConfig) {
    this.maintenanceToken = config.maintenanceApiKey;
  }

  canActivate(context: ExecutionContext) {
    if (context.getType() !== 'http') return true;
    if (!this.maintenanceToken) {
      throw new InternalServerErrorException(
        `impossible to authenticate maintenance requests`,
      );
    }

    const auth =
      context
        .switchToHttp()
        .getRequest<ExpressRequest>()
        .get('authorization') ?? '';
    if (!/^bearer /i.test(auth)) throw new UnauthorizedException();

    const bearer = auth?.slice('bearer '.length);
    if (this.maintenanceToken !== bearer) throw new UnauthorizedException();

    return true;
  }
}
