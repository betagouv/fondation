import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthUserNotAuthentifiable, DeactivatedUserNotImpersonable } from '../domain/auth-user';

@Catch(AuthUserNotAuthentifiable, DeactivatedUserNotImpersonable)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: AuthUserNotAuthentifiable | DeactivatedUserNotImpersonable) {
    if (exception instanceof AuthUserNotAuthentifiable) {
      throw new UnauthorizedException();
    }

    if (exception instanceof DeactivatedUserNotImpersonable) {
      throw new BadRequestException({ validationError: `Impossible d'usurper un compte désactivé` });
    }

    throw new InternalServerErrorException();
  }
}
