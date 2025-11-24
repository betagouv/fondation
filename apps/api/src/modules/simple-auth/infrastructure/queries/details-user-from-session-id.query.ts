import { Injectable } from '@nestjs/common';
import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class DetailsUserFromSessionIdQuery {
  constructor(
    private readonly clock: Clock,
    private readonly prisma: PrismaService,
  ) {}

  async handle(query: {
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
}
