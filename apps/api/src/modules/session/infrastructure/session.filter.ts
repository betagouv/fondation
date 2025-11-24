import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import { NonFormationMemberDefinedAsReporter } from '../domain/nomination-session';

export class SessionExceptionFilter implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        return throwError(() => {
          if (err instanceof NonFormationMemberDefinedAsReporter) {
            return new BadRequestException(
              { message: err.message },
              { cause: err },
            );
          }

          return err;
        });
      }),
    );
  }
}
