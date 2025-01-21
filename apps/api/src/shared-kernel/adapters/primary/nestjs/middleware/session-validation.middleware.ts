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
      await this.validateUserSession(req, res);
    } catch (error) {
      console.error('Error validating session', error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Error validating session');
    }
    next();
  }

  private invalidSession(req: Request) {
    return !('sessionId' in req.cookies) || !this.sessionId(req);
  }

  private async validateUserSession(req: Request, res: Response) {
    const userId = await this.sessionValidationService.validateSession(
      this.sessionId(req),
    );
    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).send('Invalid session');
    }

    req.userId = userId;
  }

  private sessionId(req: Request) {
    return req.cookies['sessionId'];
  }
}
