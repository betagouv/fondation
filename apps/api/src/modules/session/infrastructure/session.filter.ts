import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import {
  NominationFileOutcomeRequiresComment,
  UnknownNominationFileOutcome,
} from '../domain/nomination-file-outcome';
import {
  CantUpdateNominationFiles,
  NominationSessionAffectationHasUnknownReporter,
  NominationSessionIsNotDeletable,
  NonFormationMemberDefinedAsReporter,
  UnknownNominationFiles,
} from '../domain/nomination-session';

export class SessionExceptionFilter implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        return throwError(() => {
          if (err instanceof NonFormationMemberDefinedAsReporter) {
            return new BadRequestException(
              { message: err.message },
              { cause: err },
            );
          }

          if (err instanceof NominationSessionAffectationHasUnknownReporter) {
            const list = new Intl.ListFormat('fr-FR', { type: 'conjunction' });
            return new BadRequestException(
              {
                validationErrors: err.errors.map((error) => {
                  const message =
                    error.reporters.length > 1
                      ? `rapporteurs inconnus: ${list.format(error.reporters)}`
                      : `rapporteur inconnu: ${error.reporters[0]}`;

                  return `n°${error.fileNumber} ${message}`;
                }),
              },
              { cause: err },
            );
          }

          if (err instanceof UnknownNominationFiles) {
            throw new BadRequestException(
              {
                validationErrors: err.unknownFileNumbers.map(
                  (fileNumber) => `dossier n°${fileNumber} inconnu`,
                ),
              },
              { cause: err },
            );
          }

          if (err instanceof UnknownNominationFileOutcome) {
            throw new BadRequestException(
              { validationErrors: [`l'issue fournie n'existe pas`] },
              { cause: err },
            );
          }

          if (err instanceof NominationFileOutcomeRequiresComment) {
            throw new BadRequestException(
              {
                validationErrors: [
                  `l'issue définie doit obligatoirement être accompagnée d'un commentaire`,
                ],
              },
              { cause: err },
            );
          }

          if (err instanceof CantUpdateNominationFiles) {
            throw new BadRequestException(
              {
                validationErrors: [
                  err.fileIds.size === 1
                    ? `Le dossier a déjà été associé à de la documentation`
                    : `${err.fileIds.size} dossiers ont déjà été associés à de la documentation`,
                ],
              },
              { cause: err },
            );
          }

          if (err instanceof NominationSessionIsNotDeletable) {
            throw new BadRequestException({
              validationErrors: [
                `La session ne doit plus avoir d'affectation et plus de pièces jointes avant d'être supprimé`,
              ],
            });
          }

          return err;
        });
      }),
    );
  }
}
