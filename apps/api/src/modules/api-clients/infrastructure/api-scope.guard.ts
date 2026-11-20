import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth, ApiExtension } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import { ApiClientsService } from '../api-clients.service';
import { ApiClientForbidden, ApiClientUnauthenticated, ApiScope } from '../domain/api-client';

const META_SCOPE = Symbol();

@Injectable()
export class ApiScopeGuard implements CanActivate {
  constructor(
    private readonly apiClients: ApiClientsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ExpressRequest>();

    try {
      await this.apiClients.authorize({
        ip: request.ip ?? 'unknown',
        scope: this.reflector.get<ApiScope>(META_SCOPE, context.getHandler()),
        // TODO: see SimpleAuthMiddleware.getBearer, which reads the same header for the fixed machine tokens
        token: /^Bearer +(\S+)$/i.exec(request.get('authorization') ?? '')?.[1],
      });
    } catch (error) {
      if (error instanceof ApiClientUnauthenticated) throw new UnauthorizedException();
      if (error instanceof ApiClientForbidden) throw new ForbiddenException();
      throw error;
    }

    return true;
  }
}

/**
 * Opens a route of the public API to the API clients registered with this scope, and to nobody else
 *
 * @remarks the module of the controller imports `ApiClientsModule`. `x-roles` lets docs/droits-par-role.md be checked
 * against the API
 */
export function HasApiScope(scope: ApiScope): MethodDecorator {
  return applyDecorators(
    SetMetadata(META_SCOPE, scope),
    UseGuards(ApiScopeGuard),
    ApiBearerAuth(),
    ApiExtension('x-roles', ['API_CLIENT']),
  );
}
