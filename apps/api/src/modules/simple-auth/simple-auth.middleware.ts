import { Injectable, NestMiddleware } from '@nestjs/common';
import { type Request as ExpressRequest, type Response as ExpressResponse, type NextFunction } from 'express';
import z from 'zod';

import { SimpleAuthService } from './simple-auth.service';

export const IMPERSONATION_HEADER = 'X-Impersonation-Id';

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

    const sessionId: string | undefined = req.signedCookies?.['sessionId'];
    if (!sessionId) return next();

    const impersonationId = req.get(IMPERSONATION_HEADER);
    // whatever the client sends: a malformed one leaves the request anonymous, never the admin's
    if (impersonationId !== undefined && !z.uuid().safeParse(impersonationId).success) return next();

    const user: { id: string; isAdmin: boolean; role: string; impersonatorId?: string } | null =
      impersonationId
        ? await this.auth.findImpersonatedUser({
            id: impersonationId,
            authSessionId: sessionId,
          })
        : await this.auth.findUserFromValidSession(sessionId);

    if (!user) return next();

    const impersonation =
      impersonationId && user.impersonatorId
        ? { id: impersonationId, impersonatorId: user.impersonatorId }
        : undefined;

    req.user = {
      type: 'human',
      sessionId,
      impersonation,

      id: user.id,
      isAdmin: user.isAdmin,
      role: user.role,
    };
    next();
  }

  private static getBearer(req: ExpressRequest): string | null {
    const authorization = req.headers['authorization'];
    const bearer = authorization?.toLowerCase().startsWith('bearer') ? authorization?.split(' ')[1] : null;

    return bearer?.trim() || null;
  }
}
