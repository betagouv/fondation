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
  DeadlineBeforePublication,
  MissingTargetCourt,
  MissingTargetPosition,
  PublishedCallLocked,
  UntargetableCourt,
} from '../domain/call-for-applications';

@Injectable()
export class CallsForApplicationsFilter implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
          if (err instanceof DeadlineBeforePublication)
            return new BadRequestException({
              validationError: 'La date limite ne peut pas précéder la date de publication',
            });
          if (err instanceof MissingTargetCourt)
            return new BadRequestException({ validationError: 'Choisissez au moins une juridiction cible' });
          if (err instanceof UntargetableCourt)
            return new BadRequestException({
              validationError: "Une des juridictions choisies ne peut pas être la cible d'un appel",
            });
          if (err instanceof MissingTargetPosition)
            return new BadRequestException({ validationError: 'Choisissez au moins un poste cible' });
          if (err instanceof PublishedCallLocked)
            return new ConflictException({
              validationError: 'Seul un administrateur peut modifier ou supprimer un appel publié',
            });

          return err;
        }),
      ),
    );
  }
}
