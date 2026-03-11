import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class DetailsUserFromSessionIdQuery {
  constructor(
    private readonly clock: Clock,
    private readonly prisma: PrismaService,
  ) {}

  private async _handle(query: {
    sessionId: string;
  }): Promise<{ id: string; role: string } | null> {
    const maybeUser = await this.prisma.authSession.findUnique({
      select: { user: { select: { id: true, role: true } } },
      where: {
        invalidatedAt: null,
        sessionId: query.sessionId,
        expiresAt: { gt: this.clock.now() },
      },
    });

    if (!maybeUser) return null;

    const { id, role } = maybeUser.user;
    return { id, role };
  }

  async handle(query: {
    sessionId: string;
  }): Promise<{ id: string; role: string } | null> {
    return Sentry.startSpan(
      { name: 'fr.csm.fondation:queries:detailsUserFromSessionIdQuery' },
      () => this._handle(query),
    );
  }
}
