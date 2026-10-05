import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import { CannotGiveSessionFeedback, type RefusalReason } from '../domain/session-feedback';
import { assertNever } from 'src/utils/assert-never';

@Injectable()
export class FeedbackFilter implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next
      .handle()
      .pipe(
        catchError((err) =>
          throwError(() => (err instanceof CannotGiveSessionFeedback ? refusalException(err.reason) : err)),
        ),
      );
  }
}

function refusalException(reason: RefusalReason) {
  switch (reason) {
    case 'ALREADY_ANSWERED':
      return new ConflictException({ validationError: 'Vous avez déjà donné votre avis sur cette session' });
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
