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
  InvalidChairmanDuty,
  InvalidChairmanFormation,
  InvalidSecretaryDuty,
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

          return err;
        }),
      ),
    );
  }
}
