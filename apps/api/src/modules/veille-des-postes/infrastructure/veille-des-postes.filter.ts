import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import { MissingReasonDetail, NoDeclaredVacancy, UnknownVacancyAttachment } from '../domain/position-vacancy';

@Injectable()
export class VeilleDesPostesFilter implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
          if (err instanceof MissingReasonDetail)
            return new BadRequestException({ validationError: 'Précisez le motif de la vacance' });
          if (err instanceof NoDeclaredVacancy || err instanceof UnknownVacancyAttachment)
            return new NotFoundException();

          return err;
        }),
      ),
    );
  }
}
