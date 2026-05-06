import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import { NoAuthorAvailable, OnlyAuthorCanWriteSummary, UnknownReader } from '../domain/summary';

@Injectable()
export class SummaryFilter implements NestInterceptor {
  private readonly logger = new Logger(SummaryFilter.name);

  intercept(_context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((err) => {
        return throwError(() => {
          if (err instanceof UnknownReader) {
            this.logger.warn(`could not find user with id ${err.readerId}`, {
              readerId: err.readerId,
            });
            return new NotFoundException();
          }

          if (err instanceof NoAuthorAvailable) {
            this.logger.error(`the original author does not exist anymore`, {
              nominationFileId: err.nominationFileId,
            });
            return new ForbiddenException();
          }

          if (err instanceof OnlyAuthorCanWriteSummary) {
            this.logger.warn(`user ${err.userId} tried updating someone else's summary`, {
              userId: err.userId,
              authorId: err.authorId,
              nominationFileId: err.nominationFileId,
            });

            return new ForbiddenException();
          }

          return err;
        });
      }),
    );
  }
}
