import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import {
  NominationFileOutcomeRequiresComment,
  UnknownNominationFileOutcome,
} from 'src/modules/session/shared/types/nomination-file-outcome';
import {
  AuditionRequiresDateAndTime,
  CannotScheduleAuditionOnNominationFile,
  CantUpdateNominationFiles,
  NonFormationMemberDefinedAsReporter,
  SessionTransparenceAffectationHasUnknownReporter,
  SessionTransparenceIsArchived,
  SessionTransparenceIsNotArchivable,
  SessionTransparenceIsNotDeletable,
  UnknownNominationFiles,
} from 'src/modules/session/transparence/domain/session-transparence';

export class TransparenceExceptionFilter implements NestInterceptor {
  private readonly logger = new Logger(TransparenceExceptionFilter.name);
  intercept(_ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        return throwError(() => {
          if (err instanceof NonFormationMemberDefinedAsReporter) {
            return new BadRequestException({ message: err.message }, { cause: err });
          }

          if (err instanceof SessionTransparenceAffectationHasUnknownReporter) {
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
            return new BadRequestException(
              {
                validationErrors: err.unknownFileNumbers.map(
                  (fileNumber) => `dossier n°${fileNumber} inconnu`,
                ),
              },
              { cause: err },
            );
          }

          if (err instanceof UnknownNominationFileOutcome) {
            return new BadRequestException(
              { validationErrors: [`l'issue fournie n'existe pas`] },
              { cause: err },
            );
          }

          if (err instanceof NominationFileOutcomeRequiresComment) {
            return new BadRequestException(
              {
                validationErrors: [`l'issue définie doit obligatoirement être accompagnée d'un commentaire`],
              },
              { cause: err },
            );
          }

          if (err instanceof CantUpdateNominationFiles) {
            return new BadRequestException(
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

          if (err instanceof SessionTransparenceIsNotDeletable) {
            return new BadRequestException({
              validationErrors: [
                `La session ne doit plus avoir d'affectation et plus de pièces jointes avant d'être supprimé`,
              ],
            });
          }

          if (err instanceof SessionTransparenceIsArchived) {
            return new ForbiddenException({
              validationErrors: [`la session est archivée et ne peut pas être modifiée`],
            });
          }

          if (err instanceof CannotScheduleAuditionOnNominationFile) {
            return new BadRequestException({
              validationErrors: [
                `impossible de programmer une audition sur un dossier avec une issue considérée comme étant définitive`,
              ],
            });
          }

          if (err instanceof AuditionRequiresDateAndTime) {
            return new BadRequestException({
              validationErrors: [`la date et l'heure d'audition doivent être renseignées ensemble`],
            });
          }

          if (err instanceof SessionTransparenceIsNotArchivable) {
            return new BadRequestException({
              validationErrors: [`la session ne peut pas être archivée`],
            });
          }

          return err;
        });
      }),
    );
  }
}
