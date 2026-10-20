import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import {
  CantDeactivateOwnAccount,
  CantDemoteFromAdmin,
  CantPromoteMemberToAdmin,
  EmailAlreadyTaken,
} from '../domain/user';

@Injectable()
export class AdministrationErrorMapper implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) =>
        throwError(() => {
          if (error instanceof CantPromoteMemberToAdmin) {
            throw new BadRequestException({
              validationError: `Impossible de transformer un membre en administrateur`,
            });
          }

          if (error instanceof CantDemoteFromAdmin) {
            return new BadRequestException({
              validationError: `L'utilisateur n'est pas administrateur`,
            });
          }

          if (error instanceof CantDeactivateOwnAccount) {
            return new BadRequestException({
              validationError: `Impossible de désactiver son propre compte`,
            });
          }

          if (error instanceof EmailAlreadyTaken) {
            return new ConflictException({
              validationError: `Cette adresse email est déjà celle d'un autre compte`,
            });
          }

          return error;
        }),
      ),
    );
  }
}
