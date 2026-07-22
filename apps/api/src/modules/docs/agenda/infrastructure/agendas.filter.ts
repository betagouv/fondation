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
                  ? `${err.fileIds.length} dossiers apparaissent déjà dans un PV`
                  : `1 dossier apparaît déjà dans un PV`,
            });
          }

          return err;
        }),
      ),
    );
  }
}
