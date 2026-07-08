import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import { AgendaFilesAlreadyReported, EmptyAgenda } from '../domain/agenda';
import {
  AgendaIsNotCompatibleWithPresentationPlan,
  EmptyAgendaList,
  JusticePresentationPlanEndTimeShouldBeBeforeStartTime,
  PresentationPlanAgendaAlreadyReported,
  UnknownPresentationPlanChairman,
  UnknownPresentationPlanSecretary,
} from '../domain/justice-presentation-plan';
import {
  ChairmanIsNotMember,
  EmptyMembersList,
  InvalidChairmanFormation,
  InvalidSecretaryDuty,
  MixedFormationAgendas,
  MixedSessionAgendas,
  OfficialReportAgendaAlreadyReported,
  OfficialReportEndingTimeIsBeforeStatingTime,
} from '../domain/official-report';

@Injectable()
export class DocsFilter implements NestInterceptor {
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

          if (err instanceof InvalidSecretaryDuty) {
            return new BadRequestException({
              validationError: `Le secrétaire général sélectionné n'existe pas`,
            });
          }

          if (err instanceof InvalidChairmanFormation) {
            return new BadRequestException({
              validationError: `Le président n'appartient pas à une formation compatible avec la session`,
            });
          }

          if (err instanceof ChairmanIsNotMember) {
            return new BadRequestException({
              validationError: `Le président n'est pas un membre`,
            });
          }

          if (err instanceof MixedSessionAgendas) {
            return new BadRequestException({
              validationError: `Tous les ordre du jours doivent concerner la même session`,
            });
          }

          if (err instanceof MixedFormationAgendas) {
            return new BadRequestException({
              validationError: `Les ordres du jour doivent concerner la même formation`,
            });
          }

          if (err instanceof UnknownPresentationPlanChairman) {
            return new BadRequestException({
              validationError: `Le président n'est pas un membre`,
            });
          }

          if (err instanceof UnknownPresentationPlanSecretary) {
            return new BadRequestException({
              validationError: `Le secrétaire n'existe pas`,
            });
          }

          if (err instanceof EmptyAgendaList) {
            return new BadRequestException({
              validationError: `Au moins un ordre du jour doit être sélectionné`,
            });
          }

          if (err instanceof AgendaIsNotCompatibleWithPresentationPlan) {
            return new BadRequestException({
              validationError: `Tous les ordre du jour doivent concerner la même formation`,
            });
          }

          if (
            err instanceof JusticePresentationPlanEndTimeShouldBeBeforeStartTime ||
            err instanceof OfficialReportEndingTimeIsBeforeStatingTime
          ) {
            return new BadRequestException({
              validationError: `L'heure de fin de séance, doit être après l'heure de début de séance`,
            });
          }

          if (err instanceof OfficialReportAgendaAlreadyReported) {
            return new BadRequestException({
              validationError: `Un des ordre du jour sélectionnés fait déjà partie d'un PV de restitution`,
            });
          }

          if (err instanceof PresentationPlanAgendaAlreadyReported) {
            return new BadRequestException({
              validationError: `Un des ordre du jour sélectionnés fait déjà partie d'une notice de restitution`,
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
