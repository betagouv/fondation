import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import { AgendaFilesAlreadyReported, EmptyAgenda } from '../domain/agenda';

@Injectable()
export class AgendasFilter implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
          if (err instanceof EmptyAgenda) {
            return new BadRequestException({
              validationError: `Au moins un dossier valide doit être sélectionné`,
            });
          }

          if (err instanceof AgendaFilesAlreadyReported) {
            return new BadRequestException({
              validationError:
                err.fileIds.length > 1
                  ? `${err.fileIds.length} dossiers ont déjà été actés dans un procès-verbal restitué et avec une issue définitive`
                  : `1 dossier a déjà été acté dans un procès-verbal restitué et avec une issue définitive`,
            });
          }

          return err;
        }),
      ),
    );
  }
}
