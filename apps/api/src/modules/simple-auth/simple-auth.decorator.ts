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
import { assertIsDefined, isDefined } from 'src/utils/is-defined';

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
    const optionalRoles = this.reflector.getAllAndOverride<
      readonly Role[] | undefined
    >(META_ROLES, [context.getHandler(), context.getClass()]);

    const roles = assertIsDefined(
      optionalRoles,
      `The ${context.getClass().name}.${context.getHandler().name} did not define any role`,
    );

    if (context.getType() !== 'http') return true;

    const { user } = context.switchToHttp().getRequest<ExpressRequest>();
    if (!isDefined(user)) {
      throw new UnauthorizedException();
    }

    const userMissesAnyRequiredRole =
      roles.length > 0 && !roles.includes(user.role as Role);
    if (userMissesAnyRequiredRole) {
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
