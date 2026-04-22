import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { EmptyAgenda } from '../domain/agenda';
import {
  AgendaIsNotCompatibleWithPresentationPlan,
  EmptyAgendaList,
  UnknownPresentationPlanChairman,
  UnknownPresentationPlanSecretary,
} from '../domain/justice-presentation-plan';
import {
  ChairmanIsNotMember,
  InvalidChairmanDuty,
  InvalidChairmanFormation,
  InvalidSecretaryDuty,
  MixedFormationAgendas,
} from '../domain/official-report';

@Injectable()
export class DocsFilter implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
          if (err instanceof EmptyAgenda) {
            return new BadRequestException({
              validationError: `Au moins un dossier valide doit être sélectionné`,
            });
          }

          if (err instanceof InvalidChairmanDuty) {
            return new BadRequestException({
              validationError: `Le président sélectionné n'existe pas`,
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

          if (err instanceof MixedFormationAgendas) {
            return new BadRequestException({
              validationError: `Les ordres du jour doivent concerner la même formation`,
            });
          }

          if (err instanceof UnknownPresentationPlanChairman) {
            return new BadRequestException({
              validationError: `Le président n'est pas un member`,
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

          return err;
        }),
      ),
    );
  }
}
