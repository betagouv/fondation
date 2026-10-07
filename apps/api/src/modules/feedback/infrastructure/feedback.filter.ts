import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import { CannotGiveFeedback, type RefusalReason } from '../domain/feedback';
import { assertNever } from 'src/utils/assert-never';

@Injectable()
export class FeedbackFilter implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next
      .handle()
      .pipe(
        catchError((err) =>
          throwError(() => (err instanceof CannotGiveFeedback ? refusalException(err.reason) : err)),
        ),
      );
  }
}

function refusalException(reason: RefusalReason) {
  switch (reason) {
    case 'IMPERSONATED':
    case 'NOT_CONCERNED':
      return new ForbiddenException();
    case 'WRONG_QUESTIONNAIRE':
      return new BadRequestException({
        validationErrors: ['Ce questionnaire ne correspond pas à votre rôle'],
      });
    default:
      return assertNever(reason);
  }
}
