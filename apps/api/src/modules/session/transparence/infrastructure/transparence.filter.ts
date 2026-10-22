import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Logger,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import {
  NominationFileOutcomeRequiresComment,
  UnknownNominationFileOutcome,
} from '../../../shared/nomination-file-outcome.enum';
import {
  CannotScheduleAuditionOnNominationFile,
  CantUpdateNominationFiles,
  MemberMemoNotAllowed,
  NominationFileOfAnotherFormation,
  NonFormationMemberDefinedAsReporter,
  PositionAuditionCannotBeDismissed,
  SessionTransparenceAffectationHasUnassignableReporters,
  SessionTransparenceIsArchived,
  SessionTransparenceIsNotArchivable,
  SessionTransparenceIsNotDeletable,
  UnknownNominationFiles,
  UnrequestedAuditionCannotBeScheduled,
} from '../domain/session-transparence';

export class TransparenceExceptionFilter implements NestInterceptor {
  private readonly logger = new Logger(TransparenceExceptionFilter.name);
  intercept(_ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        return throwError(() => {
          if (err instanceof NonFormationMemberDefinedAsReporter) {
            return new BadRequestException({ message: err.message }, { cause: err });
          }

          if (err instanceof SessionTransparenceAffectationHasUnassignableReporters) {
            const list = new Intl.ListFormat('fr-FR', { type: 'conjunction' });
            const describe = (
              fileNumber: number,
              reporters: readonly string[],
              singular: string,
              plural: string,
            ) =>
              reporters.length > 1
                ? [`n°${fileNumber} ${plural}: ${list.format(reporters)}`]
                : reporters.map((reporter) => `n°${fileNumber} ${singular}: ${reporter}`);

            return new BadRequestException(
              {
                validationErrors: err.errors.flatMap((error) => [
                  ...describe(
                    error.fileNumber,
                    error.unknownReporters,
                    'rapporteur inconnu',
                    'rapporteurs inconnus',
                  ),
                  ...describe(
                    error.fileNumber,
                    error.deactivatedReporters,
                    'rapporteur désactivé',
                    'rapporteurs désactivés',
                  ),
                ]),
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

          if (err instanceof MemberMemoNotAllowed) {
            return new ForbiddenException({
              validationErrors: [`impossible de prendre des notes personnelles sur ce dossier`],
            });
          }

          if (err instanceof NominationFileOfAnotherFormation) {
            return new NotFoundException(undefined, { cause: err });
          }

          if (err instanceof CannotScheduleAuditionOnNominationFile) {
            return new BadRequestException({
              validationErrors: [
                `impossible de programmer une audition sur un dossier avec une issue considérée comme étant définitive`,
              ],
            });
          }

          if (err instanceof UnrequestedAuditionCannotBeScheduled) {
            return new BadRequestException({
              validationErrors: [`impossible de programmer une audition qui n'est pas prévue`],
            });
          }

          if (err instanceof PositionAuditionCannotBeDismissed) {
            return new BadRequestException({
              validationErrors: [`impossible de retirer une audition imposée par le poste`],
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
