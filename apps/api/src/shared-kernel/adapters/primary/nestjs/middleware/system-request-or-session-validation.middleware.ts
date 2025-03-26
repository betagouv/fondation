import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { SystemRequestValidationMiddleware } from './system-request.middleware';
import { SessionValidationMiddleware } from './session-validation.middleware';

@Injectable()
export class SystemRequestOrSessionValidationMiddleware
  implements NestMiddleware
{
  constructor(
    private readonly sessionValidationMiddleware: SessionValidationMiddleware,
    private readonly systemRequestValidationMiddleware: SystemRequestValidationMiddleware,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.cookies && 'sessionId' in req.cookies) {
      return this.sessionValidationMiddleware.use(req, res, next);
    } else {
      return this.systemRequestValidationMiddleware.use(req, res, next);
    }
  }
}
