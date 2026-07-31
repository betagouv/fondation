import { Injectable, Logger } from '@nestjs/common';
import { captureException } from '@sentry/node';

import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';

@Injectable()
export class DetailsUserFromImpersonationQuery {
  private readonly logger = new Logger(DetailsUserFromImpersonationQuery.name);

  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  async handle(impersonation: {
    id: string;
    authSessionId: string;
  }): Promise<{ id: string; role: string; impersonatorId: string } | null> {
    const found = await this.db.tx.authImpersonation.findFirst({
      where: { id: impersonation.id },
      select: {
        expiresAt: true,
        impersonatedUser: { select: { id: true, role: true } },
        session: {
          select: {
            sessionId: true,
            expiresAt: true,
            user: { select: { id: true, role: true } },
          },
        },
      },
    });

    if (!found) return null;

    if (found.session.sessionId !== impersonation.authSessionId) {
      // should not happen
      captureException(
        Object.assign(new Error(`Received impersonated request from wrong session`), {
          expectedSessionId: found.session.sessionId,
          providedSessionId: impersonation.authSessionId,
        }),
      );
      this.logger.error(
        `Received impersonated request from wrong session. Expected "${found.session.sessionId}", received: "${impersonation.authSessionId}"`,
      );

      return null;
    }

    if (found.session.user.role !== 'ADMIN') {
      // should not happen
      captureException(
        Object.assign(new Error(`Received impersonated request from non ADMIN user`), {
          userId: found.session.user.id,
          userRole: found.session.user.role,
        }),
      );
      this.logger.error(
        `Received impersonated request from wrong session. Expected "${found.session.sessionId}", received: "${impersonation.authSessionId}"`,
      );

      return null;
    }

    const now = this.clock.now().getTime();
    if (found.expiresAt.getTime() <= now || found.session.expiresAt.getTime() <= now) {
      return null;
    }

    return {
      id: found.impersonatedUser.id,
      role: found.impersonatedUser.role,
      impersonatorId: found.session.user.id,
    };
  }
}
