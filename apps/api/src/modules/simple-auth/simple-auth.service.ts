import { Inject, Injectable } from '@nestjs/common';
import * as cookieSignature from 'cookie-signature';
import { and, eq, isNull } from 'drizzle-orm';
import { Db } from 'src/modules/framework/drizzle';
import { sessions, users } from 'src/modules/framework/drizzle/schemas';
import { API_CONFIG_TOKEN, ApiConfig } from '../framework/config';

@Injectable()
export class SimpleAuthService {
  private readonly cookieSecret: string;
  constructor(
    private readonly db: Db,
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

    const result = await this.db
      .select()
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(eq(sessions.sessionId, sessionId), isNull(sessions.invalidatedAt)),
      )
      .limit(1);

    const [sessionAndUser] = result;
    if (!sessionAndUser) return null;

    const { id, role } = sessionAndUser.users;
    return { id, role };
  }
}
