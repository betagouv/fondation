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

          if (err instanceof UnknownPhoneNumber) return new NotFoundException();

          return err;
        }),
      ),
    );
  }
}
