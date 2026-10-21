import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';

import { Prisma } from '../../../../generated/prisma/client';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';

@Injectable()
export class DetailsUserFromSessionIdQuery {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  private async _handle(query: {
    sessionId: string;
  }): Promise<{ id: string; isAdmin: boolean; role: string } | null> {
    const maybeUser = await this.db.tx.authSession.findUnique({
      select: {
        user: { select: { id: true, isAdmin: true, role: true } },
      } satisfies Prisma.AuthSessionSelect,
      where: {
        invalidatedAt: null,
        sessionId: query.sessionId,
        expiresAt: { gt: this.clock.now() },
      },
    });

    if (!maybeUser) return null;

    const { id, isAdmin, role } = maybeUser.user;
    return { id, isAdmin, role };
  }

  async handle(query: { sessionId: string }): Promise<{ id: string; isAdmin: boolean; role: string } | null> {
    return Sentry.startSpan({ name: 'fr.csm.fondation:queries:detailsUserFromSessionIdQuery' }, () =>
      this._handle(query),
    );
  }
}
