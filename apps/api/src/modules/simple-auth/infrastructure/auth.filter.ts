import { Catch, ExceptionFilter, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

import { AuthUserNotAuthentifiable } from '../domain/auth-user';

@Catch(AuthUserNotAuthentifiable)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: AuthUserNotAuthentifiable) {
    if (exception instanceof AuthUserNotAuthentifiable) {
      throw new UnauthorizedException();
    }

    throw new InternalServerErrorException();
  }
}
