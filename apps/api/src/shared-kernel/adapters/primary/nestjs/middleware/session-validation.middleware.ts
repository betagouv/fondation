import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SessionValidationService } from 'src/shared-kernel/business-logic/gateways/services/session-validation.service';

@Injectable()
export class SessionValidationMiddleware implements NestMiddleware {
  constructor(
    private readonly sessionValidationService: SessionValidationService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (this.invalidSession(req)) {
      return res.status(HttpStatus.UNAUTHORIZED).send('Session ID not found');
    }

    try {
      const userId = await this.validateUserSession(req);
      if (!userId) {
        return res.status(HttpStatus.UNAUTHORIZED).send('Invalid session');
      }

      req.userId = userId;
      next();
    } catch (error) {
      console.error('Error validating session', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Error validating session');
    }
  }

  private invalidSession(req: Request) {
    return !('sessionId' in req.cookies) || !this.sessionId(req);
  }

  private async validateUserSession(req: Request) {
    console.log('Validating session', this.sessionId(req));
    return this.sessionValidationService.validateSession(this.sessionId(req));
  }

  private sessionId(req: Request) {
    return req.cookies['sessionId'];
  }
}
