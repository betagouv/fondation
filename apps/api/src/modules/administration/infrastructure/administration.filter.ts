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
  CantGiveAdminAMemberRole,
  CantGiveTechnicalAccountThisRole,
  CantManageTechnicalAccounts,
  CantPromoteMemberToAdmin,
  CantResetPasswordOfDeactivatedAccount,
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

          if (error instanceof CantGiveTechnicalAccountThisRole) {
            return new BadRequestException({
              validationError: `Un compte technique a un rôle du secrétariat général sans titre`,
            });
          }

          if (error instanceof CantManageTechnicalAccounts) {
            return new BadRequestException({
              validationError: `Seul un compte technique gère les comptes techniques`,
            });
          }

          if (error instanceof CantGiveAdminAMemberRole) {
            return new BadRequestException({
              validationError: `Retirez d'abord les droits administrateur`,
            });
          }

          if (error instanceof CantDeactivateOwnAccount) {
            return new BadRequestException({
              validationError: `Impossible de désactiver son propre compte`,
            });
          }

          if (error instanceof CantResetPasswordOfDeactivatedAccount) {
            return new BadRequestException({
              validationError: `Impossible de réinitialiser le mot de passe d'un compte désactivé`,
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
