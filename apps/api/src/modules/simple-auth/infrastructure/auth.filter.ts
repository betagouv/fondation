import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import {
  AuthUserNotAuthentifiable,
  CannotChangePassword,
  DeactivatedUserNotImpersonable,
  WrongCurrentPassword,
} from '../domain/auth-user';

@Catch(AuthUserNotAuthentifiable, CannotChangePassword, DeactivatedUserNotImpersonable, WrongCurrentPassword)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(
    exception:
      | AuthUserNotAuthentifiable
      | CannotChangePassword
      | DeactivatedUserNotImpersonable
      | WrongCurrentPassword,
  ) {
    if (exception instanceof AuthUserNotAuthentifiable) {
      throw new UnauthorizedException();
    }

    if (exception instanceof CannotChangePassword) {
      throw new ForbiddenException();
    }

    if (exception instanceof DeactivatedUserNotImpersonable) {
      throw new BadRequestException({ validationError: `Impossible d'usurper un compte désactivé` });
    }

    // a 400 and not a 401, which the client would take for the end of the session
    if (exception instanceof WrongCurrentPassword) {
      throw new BadRequestException({ validationError: `Le mot de passe actuel est incorrect` });
    }

    throw new InternalServerErrorException();
  }
}
