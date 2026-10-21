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
} from '../domain/auth-user';

@Catch(AdminOutsideSecretariat, AuthUserNotAuthentifiable, DeactivatedUserNotImpersonable)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: AdminOutsideSecretariat | AuthUserNotAuthentifiable | DeactivatedUserNotImpersonable) {
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

    throw new InternalServerErrorException();
  }
}
