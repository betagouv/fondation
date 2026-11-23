import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import {
  ApiClientNotRotatable,
  ApiClientNotUpdatable,
  CantManageApiClients,
  InvalidAllowedIp,
  LIMIT_PER_MINUTE,
  ROTATION_DAYS,
} from '../domain/api-client';

const NOT_ROTATABLE_MESSAGES = {
  days: `L'ancien secret reste valide entre 1 et ${ROTATION_DAYS.max} jours`,
  revoked: 'Ce client API est révoqué',
  rotating: "Une rotation est en cours : clore la rotation avant d'en lancer une autre",
} as const satisfies Record<ApiClientNotRotatable['reason'], string>;

const NOT_UPDATABLE_MESSAGES = {
  limit: `Une limite est un nombre entier d'appels par minute, entre ${LIMIT_PER_MINUTE.min} et ${LIMIT_PER_MINUTE.max}`,
  revoked: 'Ce client API est révoqué',
} as const satisfies Record<ApiClientNotUpdatable['reason'], string>;

@Injectable()
export class ApiClientsErrorMapper implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) =>
        throwError(() => {
          if (error instanceof CantManageApiClients) return new ForbiddenException();

          if (error instanceof InvalidAllowedIp) {
            return new BadRequestException({
              validationError: `« ${error.ip} » n'est pas une adresse IPv4 ou IPv6`,
            });
          }

          if (error instanceof ApiClientNotRotatable) {
            const validationError = NOT_ROTATABLE_MESSAGES[error.reason];

            return error.reason === 'days'
              ? new BadRequestException({ validationError })
              : new ConflictException({ validationError });
          }

          if (error instanceof ApiClientNotUpdatable) {
            const validationError = NOT_UPDATABLE_MESSAGES[error.reason];

            return error.reason === 'limit'
              ? new BadRequestException({ validationError })
              : new ConflictException({ validationError });
          }

          return error;
        }),
      ),
    );
  }
}
