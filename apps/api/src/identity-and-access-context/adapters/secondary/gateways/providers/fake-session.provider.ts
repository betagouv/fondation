import { SessionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/session-provider';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

type SessionId = string;

export type FakeSession = {
  userId: string;
  sessionId: SessionId;
  valid: boolean;
};

export class FakeSessionProvider implements SessionProvider {
  sessions: Record<SessionId, FakeSession> = {};

  createSession(userId: string) {
    return async () => {
      const sessionId = `session-${userId}`;
      this.sessions[sessionId] = { userId, sessionId, valid: true };
      return sessionId;
    };
  }

  invalidateSession(sessionId: string): TransactionableAsync {
    return async () => {
      if (this.sessions[sessionId]) {
        this.sessions[sessionId].valid = false;
      }
    };
  }

  setSessions(
    ...sessions: { userId: string; sessionId: string; valid?: boolean }[]
  ) {
    for (const { userId, sessionId, valid } of sessions) {
      this.sessions[sessionId] = { userId, sessionId, valid: valid || true };
    }
  }
}
