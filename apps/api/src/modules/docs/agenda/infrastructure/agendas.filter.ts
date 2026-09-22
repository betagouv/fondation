import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import {
  AgendaDocumentNotStored,
  AgendaFilesAlreadyReported,
  EmptyAgenda,
  UnknownAgendaFileBlock,
} from '../domain/agenda';

@Injectable()
export class AgendasFilter implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
          if (err instanceof EmptyAgenda) {
            return new BadRequestException({
              validationError:
                "Un ordre du jour ne peut pas être vide. Pour le supprimer, utilisez l'action Supprimer dans la liste des documents de la session.",
            });
          }

          if (err instanceof AgendaDocumentNotStored) {
            return new BadRequestException({
              validationError: `Le document n'a pas pu être enregistré, l'ordre du jour n'est donc pas validé`,
            });
          }

          if (err instanceof UnknownAgendaFileBlock) {
            return new BadRequestException({
              validationError:
                "Cette section ne fait plus partie de l'ordre du jour. Rechargez la page pour repartir de son contenu à jour.",
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
