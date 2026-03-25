import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { CantDemoteFromAdmin, CantPromoteMemberToAdmin } from '../domain/user';

@Injectable()
export class AdministrationErrorMapper implements NestInterceptor {
  intercept(
    _ctx: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
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

          return error;
        }),
      ),
    );
  }
}
