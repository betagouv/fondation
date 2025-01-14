import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SessionValidationService } from 'src/shared-kernel/business-logic/gateways/services/session-validation.service';

@Injectable()
export class SessionValidationMiddleware implements NestMiddleware {
  constructor(
    private readonly sessionValidationService: SessionValidationService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (!('sessionId' in req.cookies) || !this.sessionId(req)) {
      return res.status(HttpStatus.UNAUTHORIZED).send('Session ID not found');
    }

    try {
      const isValid = await this.sessionValidationService.validateSession(
        this.sessionId(req),
      );
      if (!isValid) {
        return res.status(HttpStatus.UNAUTHORIZED).send('Invalid session');
      }
    } catch (error) {
      console.error('Error validating session', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Error validating session');
    }

    next();
  }

  private sessionId(req: Request) {
    return req.cookies['sessionId'];
  }
}
