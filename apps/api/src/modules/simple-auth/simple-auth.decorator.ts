import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiCookieAuth } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import type { RoleEnum } from 'src/modules/shared/role.enum';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';

export const AuthedUserId = createParamDecorator((_, ctx: ExecutionContext) => {
  const { user } = ctx.switchToHttp().getRequest<ExpressRequest>();
  if (!user || user.type === 'machine') throw new UnauthorizedException();

  return user.id;
});

export const AuthedUser = createParamDecorator((_, ctx: ExecutionContext) => {
  const { user } = ctx.switchToHttp().getRequest<ExpressRequest>();
  if (!user || user.type === 'machine') throw new UnauthorizedException();

  return user;
});

export const IsMachine = createParamDecorator((_, ctx: ExecutionContext) => {
  const { user } = ctx.switchToHttp().getRequest<ExpressRequest>();

  return user?.type === 'machine';
});

const META_ROLES = Symbol();

@Injectable()
class HasRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const optionalRoles = this.reflector.getAllAndOverride<readonly (RoleEnum | 'MACHINE')[] | undefined>(
      META_ROLES,
      [context.getHandler(), context.getClass()],
    );

    const roles = assertIsDefined(
      optionalRoles,
      `The ${context.getClass().name}.${context.getHandler().name} did not define any role`,
    );

    if (context.getType() !== 'http') return true;

    const { user } = context.switchToHttp().getRequest<ExpressRequest>();
    if (!isDefined(user)) {
      throw new UnauthorizedException();
    }

    if (user.type === 'machine') return roles.includes('MACHINE');
    if (user.role === 'ADMIN') return true;

    const userMissesAnyRequiredRole = roles.length > 0 && !roles.includes(user.role as RoleEnum);
    if (userMissesAnyRequiredRole) {
      throw new ForbiddenException();
    }

    return true;
  }
}

export function HasRole(...roles: readonly (RoleEnum | 'MACHINE')[]): MethodDecorator {
  const decorators = [SetMetadata(META_ROLES, roles), UseGuards(mixin(HasRoleGuard))];

  if (roles.length === 0 || roles.filter((x) => x !== 'MACHINE').length > 0) {
    decorators.push(ApiCookieAuth('sessionId'));
  }

  return applyDecorators(...decorators);
}
