import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { Db } from 'src/modules/framework/drizzle';
import { sessions, users } from 'src/modules/framework/drizzle/schemas';

@Injectable()
export class SimpleAuthService {
  constructor(private readonly db: Db) {}

  async findUserFromValidSession(
    sessionId: string,
  ): Promise<{ id: string; role: string } | null> {
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
