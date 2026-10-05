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
              validationError: `Le numéro doit compter de ${MIN_PHONE_NUMBER_DIGITS} à ${MAX_PHONE_NUMBER_DIGITS} chiffres, séparés au besoin par des espaces, des points ou des tirets`,
            });
          if (err instanceof InvalidPhoneNumberLabel)
            return new BadRequestException({
              validationError: `L'étiquette fait ${MAX_LABEL_LENGTH} caractères au maximum`,
            });
          if (err instanceof PhoneNumberAlreadySaved)
            return new ConflictException({ validationError: 'Ce numéro est déjà enregistré' });
          if (err instanceof TooManyPhoneNumbers)
            return new ConflictException({
              validationError: `Ce magistrat a déjà ${MAX_PHONE_NUMBERS} numéros enregistrés`,
            });

          if (err instanceof UnknownPhoneNumber) return new NotFoundException();

          return err;
        }),
      ),
    );
  }
}
