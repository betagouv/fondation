import { Injectable, NestMiddleware } from '@nestjs/common';
import {
  type Request as ExpressRequest,
  type Response as ExpressResponse,
  type NextFunction,
} from 'express';
import { SimpleAuthService } from './simple-auth.service';

@Injectable()
export class SimpleAuthMiddleware implements NestMiddleware {
  constructor(private readonly auth: SimpleAuthService) {}

  async use(req: ExpressRequest, _res: ExpressResponse, next: NextFunction) {
    const bearer = SimpleAuthMiddleware.getBearer(req);
    const machine = bearer ? await this.auth.findMachine({ bearer }) : null;
    if (machine) {
      req.user = { type: 'machine', ...machine };
      return next();
    }

    const sessionId = req.signedCookies?.['sessionId'];
    if (!sessionId) return next();

    const user = await this.auth.findUserFromValidSession(sessionId);
    if (!user) return next();

    req.user = { type: 'human', ...user };
    next();
  }

  private static getBearer(req: ExpressRequest): string | null {
    const authorization = req.headers['authorization'];
    const bearer = authorization?.toLowerCase().startsWith('bearer')
      ? authorization?.split(' ')[1]
      : null;

    return bearer?.trim() || null;
  }
}
