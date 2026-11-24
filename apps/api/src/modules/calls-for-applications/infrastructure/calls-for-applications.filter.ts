import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import { DeadlineBeforePublication } from '../domain/call-for-applications';

@Injectable()
export class CallsForApplicationsFilter implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() =>
          err instanceof DeadlineBeforePublication
            ? new BadRequestException({
                validationError: 'La date limite ne peut pas précéder la date de publication',
              })
            : err,
        ),
      ),
    );
  }
}
