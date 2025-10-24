import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
  Injectable,
  SetMetadata,
  applyDecorators,
  UseGuards,
  mixin,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request as ExpressRequest } from 'express';
import { Role } from 'shared-models';

export const AuthedUserId = createParamDecorator((_, ctx: ExecutionContext) => {
  const { user } = ctx.switchToHttp().getRequest<ExpressRequest>();
  if (!user) throw new UnauthorizedException();

  return user.id;
});

const META_ROLES = Symbol();

@Injectable()
class HasRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<readonly Role[]>(
      META_ROLES,
      [context.getHandler(), context.getClass()],
    );

    if (!roles) throw new ForbiddenException();

    if (context.getType() !== 'http') return true;

    const { user } = context.switchToHttp().getRequest<ExpressRequest>();

    const userHasAnyRequiredRole =
      roles.length > 1 && roles.includes(user?.role as Role);
    if (!user || !userHasAnyRequiredRole) {
      throw new ForbiddenException();
    }

    return true;
  }
}

export function HasRole(...roles: readonly Role[]): MethodDecorator {
  return applyDecorators(
    SetMetadata(META_ROLES, roles),
    UseGuards(mixin(HasRoleGuard)),
  );
}
