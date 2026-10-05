import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import { CannotScheduleObservantAudition, type UnschedulableReason } from '../domain/observant-audition';
import { ObservationAlreadyExist } from '../domain/observation';
import { assertNever } from 'src/utils/assert-never';

@Injectable()
export class ObservationsFilter implements NestInterceptor {
  private readonly logger = new Logger(ObservationsFilter.name);

  intercept(_ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
          if (err instanceof ObservationAlreadyExist) {
            this.logger.warn(
              `Observation already exist (magistratId=${err.magistratId}, nominationFileId=${err.nominationFileId})`,
            );

            return new ConflictException({
              validationError: `Une observation de ce magistrat existe déjà pour ce dossier`,
            });
          }

          if (err instanceof CannotScheduleObservantAudition) {
            return new BadRequestException({ validationErrors: [unschedulableAuditionMessage(err.reason)] });
          }

          return err;
        }),
      ),
    );
  }
}

function unschedulableAuditionMessage(reason: UnschedulableReason): string {
  switch (reason) {
    case 'FINAL_OUTCOME':
      return `impossible de programmer l'audition : tous les dossiers observés ont une issue considérée comme étant définitive`;
    case 'LOCKED':
      return `impossible de programmer l'audition : les dossiers observés ont déjà été associés à de la documentation`;
    case 'NOT_IN_PROGRESS':
      return `impossible de programmer l'audition : aucun dossier observé n'est encore en traitement`;
    default:
      return assertNever(reason);
  }
}
