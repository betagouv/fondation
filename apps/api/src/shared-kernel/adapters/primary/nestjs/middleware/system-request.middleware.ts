import { HttpStatus, Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';

export const systemRequestHeaderKey = 'x-system-request-token';

@Injectable()
export class SystemRequestValidationMiddleware implements NestMiddleware {
  constructor(
    @Inject()
    private readonly systemRequestSignatureProvider: SystemRequestSignatureProvider,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    return this.validToken(req)
      ? next()
      : res.status(HttpStatus.UNAUTHORIZED).send('Invalid token');
  }

  private validToken(req: Request): boolean {
    const token = req.headers[systemRequestHeaderKey];

    if (!token) {
      console.error('No token provided');
      return false;
    }

    if (Array.isArray(token)) {
      console.warn('Multiple tokens provided. Taking only the first one.');
      return this.systemRequestSignatureProvider.validateSignature(token[0]!);
    }

    return this.systemRequestSignatureProvider.validateSignature(token);
  }
}
