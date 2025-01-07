import { SessionRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/session-repository';
import { UserSession } from 'src/identity-and-access-context/business-logic/models/session';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeSessionRepository implements SessionRepository {
  sessions: Record<string, UserSession> = {};

  create(session: UserSession): TransactionableAsync<void> {
    return async () => {
      this.sessions[session.sessionId] = session;
    };
  }

  session(sessionId: string): TransactionableAsync<UserSession | null> {
    return async () => {
      return this.sessions[sessionId] || null;
    };
  }
}
