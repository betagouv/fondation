import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { ObservationAlreadyExist } from '../domain/observation';

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

          return err;
        }),
      ),
    );
  }
}
