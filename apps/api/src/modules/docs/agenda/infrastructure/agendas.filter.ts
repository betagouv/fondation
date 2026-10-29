import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import {
  AgendaAlreadyValidated,
  AgendaDocumentNotStored,
  AgendaDraftChangedByTheApplication,
  AgendaFilesAlreadyReported,
  AgendaWithoutValidatedVersion,
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

          if (err instanceof AgendaAlreadyValidated) {
            return new ConflictException({ validationError: `L'ordre du jour est déjà validé` });
          }

          if (err instanceof AgendaDraftChangedByTheApplication) {
            return new ConflictException({
              validationError: `L'application a modifié ce brouillon entre-temps : il n'est plus possible de revenir à la version validée`,
            });
          }

          if (err instanceof AgendaWithoutValidatedVersion) {
            return new ConflictException({
              validationError: `Ce document n'a jamais été validé : il n'y a pas de version à laquelle revenir`,
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
                  ? `${err.fileIds.length} dossiers ont déjà été actés dans un ordre du jour restitué et avec une issue définitive`
                  : `1 dossier a déjà été acté dans un ordre du jour restitué et avec une issue définitive`,
            });
          }

          return err;
        }),
      ),
    );
  }
}
