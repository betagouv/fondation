import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import {
  OnlyAuthorCanWriteSummary,
  SummaryAttachmentsLocked,
  SummarySessionIsArchived,
  UnknownReader,
} from './domain/summary';

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

          if (err instanceof OnlyAuthorCanWriteSummary) {
            this.logger.warn(`user ${err.userId} tried updating someone else's summary`, {
              userId: err.userId,
              authorId: err.authorId,
              nominationFileId: err.nominationFileId,
            });

            return new ForbiddenException();
          }

          // the dossier got figé after the page loaded: the client reloads what it shows
          if (err instanceof SummaryAttachmentsLocked) {
            return new ConflictException({
              validationErrors: [
                `le dossier est figé : ses pièces jointes ne se renomment ni ne se retirent plus`,
              ],
            });
          }

          if (err instanceof SummarySessionIsArchived) {
            return new ForbiddenException({
              validationErrors: [`la session est archivée et la synthèse ne peut pas être modifiée`],
            });
          }

          return err;
        });
      }),
    );
  }
}
