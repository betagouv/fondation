import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  type NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { catchError, type Observable, throwError } from 'rxjs';

import {
  AuthUserNotAuthentifiable,
  CannotChangePassword,
  UserNotImpersonable,
  WrongCurrentPassword,
} from '../domain/auth-user';

@Injectable()
export class AuthExceptionFilter implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(catchError((err: unknown) => throwError(() => AuthExceptionFilter.httpException(err))));
  }

  private static httpException(err: unknown): unknown {
    if (err instanceof AuthUserNotAuthentifiable) return new UnauthorizedException();
    if (err instanceof CannotChangePassword) return new ForbiddenException();
    if (err instanceof UserNotImpersonable)
      return new BadRequestException({
        validationError: `Seul le compte actif d'un membre peut être usurpé`,
      });
    // a 400 and not a 401, which the client would take for the end of the session
    if (err instanceof WrongCurrentPassword)
      return new BadRequestException({ validationError: `Le mot de passe actuel est incorrect` });

    return err;
  }
}
