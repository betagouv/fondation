import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import {
  AdminOutsideSecretariat,
  AuthUserNotAuthentifiable,
  DeactivatedUserNotImpersonable,
  WrongCurrentPassword,
} from '../domain/auth-user';

@Catch(
  AdminOutsideSecretariat,
  AuthUserNotAuthentifiable,
  DeactivatedUserNotImpersonable,
  WrongCurrentPassword,
)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(
    exception:
      | AdminOutsideSecretariat
      | AuthUserNotAuthentifiable
      | DeactivatedUserNotImpersonable
      | WrongCurrentPassword,
  ) {
    if (exception instanceof AdminOutsideSecretariat) {
      throw new BadRequestException({
        validationError: `Le droit administrateur est réservé au secrétariat général`,
      });
    }

    if (exception instanceof AuthUserNotAuthentifiable) {
      throw new UnauthorizedException();
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
