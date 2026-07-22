import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import {
  AgendaIsNotCompatibleWithPresentationPlan,
  EmptyAgendaList,
  JusticePresentationPlanEndTimeShouldBeBeforeStartTime,
  PresentationPlanAgendaAlreadyReported,
  UnknownPresentationPlanChairman,
  UnknownPresentationPlanSecretary,
} from '../domain/justice-presentation-plan';

@Injectable()
export class PresentationPlansFilter implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
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

          if (err instanceof JusticePresentationPlanEndTimeShouldBeBeforeStartTime) {
            return new BadRequestException({
              validationError: `L'heure de fin de séance, doit être après l'heure de début de séance`,
            });
          }

          if (err instanceof PresentationPlanAgendaAlreadyReported) {
            return new BadRequestException({
              validationError: `Un des ordre du jour sélectionnés fait déjà partie d'une notice de restitution`,
            });
          }

          return err;
        }),
      ),
    );
  }
}
