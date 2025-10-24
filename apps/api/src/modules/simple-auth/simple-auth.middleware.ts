import { Injectable, NestMiddleware } from '@nestjs/common';
import {
  type Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from 'express';
import { SimpleAuthService } from './simple-auth.service';

@Injectable()
export class SimpleAuthMiddleware implements NestMiddleware {
  constructor(private readonly auth: SimpleAuthService) {}

  async use(req: ExpressRequest, _res: ExpressResponse, next: NextFunction) {
    const sessionId = req.cookies?.['sessionId'];
    if (!sessionId) return next();

    const user = await this.auth.findUserFromValidSession(sessionId);
    if (!user) return next();

    req.user = user;
    next();
  }
}
