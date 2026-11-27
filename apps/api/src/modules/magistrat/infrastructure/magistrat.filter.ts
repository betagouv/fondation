import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

import { AttachedMagistratEmailAlreadyDetached } from '../domain/attached-magistrat-email';
import {
  InvalidPhoneNumber,
  InvalidPhoneNumberLabel,
  MAX_LABEL_LENGTH,
  MAX_PHONE_NUMBER_DIGITS,
  MAX_PHONE_NUMBERS,
  MIN_PHONE_NUMBER_DIGITS,
  PhoneNumberAlreadySaved,
  TooManyPhoneNumbers,
  UnknownPhoneNumber,
} from '../domain/magistrat-phone-numbers';
import {
  InactiveMagistrat,
  UnrecognisedMagistratEmailAlreadyHandled,
} from '../domain/unrecognised-magistrat-email';

@Injectable()
export class MagistratFilter implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
          if (err instanceof InvalidPhoneNumber)
            return new BadRequestException({
              validationError: `Saisissez un numéro de ${MIN_PHONE_NUMBER_DIGITS} à ${MAX_PHONE_NUMBER_DIGITS} chiffres. Les espaces, points et tirets sont acceptés.`,
            });
          if (err instanceof InvalidPhoneNumberLabel)
            return new BadRequestException({
              validationError: `L'étiquette fait ${MAX_LABEL_LENGTH} caractères au maximum`,
            });
          if (err instanceof PhoneNumberAlreadySaved)
            return new ConflictException({ validationError: 'Ce numéro est déjà enregistré' });
          if (err instanceof TooManyPhoneNumbers)
            return new ConflictException({
              validationError: `${MAX_PHONE_NUMBERS} numéros au maximum par magistrat`,
            });

          if (err instanceof InactiveMagistrat)
            return new BadRequestException({
              validationError: "Une adresse ne peut être rattachée qu'à un magistrat en activité",
            });

          if (err instanceof AttachedMagistratEmailAlreadyDetached)
            return new ConflictException({ validationError: 'Cette adresse a déjà été détachée' });
          if (err instanceof UnrecognisedMagistratEmailAlreadyHandled)
            return new ConflictException({ validationError: 'Cette adresse a déjà été traitée' });

          if (err instanceof UnknownPhoneNumber) return new NotFoundException();

          return err;
        }),
      ),
    );
  }
}
