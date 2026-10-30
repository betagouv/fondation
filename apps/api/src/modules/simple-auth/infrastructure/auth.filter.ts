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
  UserNotImpersonable,
  WrongCurrentPassword,
} from '../domain/auth-user';

@Catch(AuthUserNotAuthentifiable, CannotChangePassword, UserNotImpersonable, WrongCurrentPassword)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(
    exception: AuthUserNotAuthentifiable | CannotChangePassword | UserNotImpersonable | WrongCurrentPassword,
  ) {
    if (exception instanceof AuthUserNotAuthentifiable) {
      throw new UnauthorizedException();
    }

    if (exception instanceof CannotChangePassword) {
      throw new ForbiddenException();
    }

    if (exception instanceof UserNotImpersonable) {
      throw new BadRequestException({ validationError: `Seul le compte actif d'un membre peut être usurpé` });
    }

    // a 400 and not a 401, which the client would take for the end of the session
    if (exception instanceof WrongCurrentPassword) {
      throw new BadRequestException({ validationError: `Le mot de passe actuel est incorrect` });
    }

    throw new InternalServerErrorException();
  }
}
