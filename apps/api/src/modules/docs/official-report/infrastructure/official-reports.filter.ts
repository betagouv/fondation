import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import { OfficialReportDocumentNotStored } from '../domain/official-report';
import { OfficialReportAgendaAlreadyReported } from '../domain/official-report-agenda';
import {
  InvalidChairmanDuty,
  InvalidChairmanFormation,
  InvalidChairmanRole,
  InvalidChairmanTitle,
} from '../domain/official-report-chairman';
import {
  InvalidMemberDuty,
  InvalidMemberFormation,
  InvalidMemberRole,
  InvalidMemberTitle,
} from '../domain/official-report-member';
import { EmptyMembersList } from '../domain/official-report-member-list';
import {
  InvalidSecretaryDuty,
  InvalidSecretaryRole,
  InvalidSecretaryTitle,
} from '../domain/official-report-secretary';
import { OfficialReportMeetingSessionEndingTimeBeforeStartingTime } from '../domain/official-report-session-meeting';

@Injectable()
export class OfficialReportsFilter implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
          if (
            err instanceof InvalidSecretaryDuty ||
            err instanceof InvalidSecretaryRole ||
            err instanceof InvalidSecretaryTitle
          ) {
            return new BadRequestException({
              validationError: `Le secrétaire général sélectionné n'existe pas`,
            });
          }

          if (
            err instanceof InvalidChairmanRole ||
            err instanceof InvalidChairmanFormation ||
            err instanceof InvalidChairmanDuty ||
            err instanceof InvalidChairmanTitle
          ) {
            return new BadRequestException({
              validationError: `L'utilisateur sélectionné ne peut pas être président de séance`,
            });
          }

          if (err instanceof OfficialReportMeetingSessionEndingTimeBeforeStartingTime) {
            return new BadRequestException({
              validationError: `L'heure de fin de séance, doit être après l'heure de début de séance`,
            });
          }

          if (err instanceof OfficialReportDocumentNotStored) {
            return new BadRequestException({
              validationError: `Le document n'a pas pu être enregistré, le PV n'est donc pas validé`,
            });
          }

          if (err instanceof OfficialReportAgendaAlreadyReported) {
            return new BadRequestException({
              validationError: `L'ODJ fait déjà partie d'un PV de restitution`,
            });
          }

          if (
            err instanceof InvalidMemberFormation ||
            err instanceof InvalidMemberRole ||
            err instanceof InvalidMemberDuty ||
            err instanceof InvalidMemberTitle
          ) {
            return new BadRequestException({
              validationError: `Certains utilisateurs désignés ne peuvent pas participer à la séance de restitution`,
            });
          }

          if (err instanceof EmptyMembersList) {
            return new BadRequestException({
              validationError: `La liste des members présent est vide`,
            });
          }

          return err;
        }),
      ),
    );
  }
}
