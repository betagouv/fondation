import { Injectable, Logger } from '@nestjs/common';
import { captureException } from '@sentry/node';

import { Prisma } from '../../../../generated/prisma/client';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import { userStatusOf } from '../../../shared/user-status.enum';
import { AuthUser } from '../../domain/auth-user';

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
  }): Promise<{ id: string; isAdmin: boolean; role: string; impersonatorId: string } | null> {
    const found = await this.db.tx.authImpersonation.findFirst({
      where: { id: impersonation.id },
      select: {
        expiresAt: true,
        impersonatedUser: { select: { deactivatedAt: true, id: true, isAdmin: true, role: true } },
        session: {
          select: {
            sessionId: true,
            expiresAt: true,
            user: { select: { id: true, isAdmin: true } },
          },
        },
      } satisfies Prisma.AuthImpersonationSelect,
    });

    if (!found || !AuthUser.canBeImpersonated({ status: userStatusOf(found.impersonatedUser) })) return null;

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

    if (!found.session.user.isAdmin) {
      // should not happen
      captureException(
        Object.assign(new Error(`Received impersonated request from non ADMIN user`), {
          userId: found.session.user.id,
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
      isAdmin: found.impersonatedUser.isAdmin,
      role: found.impersonatedUser.role,
      impersonatorId: found.session.user.id,
    };
  }
}
