import { Inject, Injectable } from '@nestjs/common';
import * as cookieSignature from 'cookie-signature';
import { API_CONFIG_TOKEN, ApiConfig } from '../framework/config';
import { PrismaService } from '../framework/database';

@Injectable()
export class SimpleAuthService {
  private readonly cookieSecret: string;
  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_CONFIG_TOKEN)
    config: ApiConfig,
  ) {
    this.cookieSecret = config.cookieSecret;
  }

  async findUserFromValidSession(
    signedSessionId: string,
  ): Promise<{ id: string; role: string } | null> {
    const sessionId = cookieSignature.unsign(
      signedSessionId,
      this.cookieSecret,
    );
    if (!sessionId) return null;

    const result = await this.prisma.authSession.findUnique({
      select: { user: { select: { id: true, role: true } } },
      where: {
        sessionId,
        invalidatedAt: null,
      },
    });

    if (!result) return null;

    const { id, role } = result.user;
    return { id, role };
  }
}
