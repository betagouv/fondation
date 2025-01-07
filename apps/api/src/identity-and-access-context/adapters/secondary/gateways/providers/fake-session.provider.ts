import { SessionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/session-provider';

export class FakeSessionProvider implements SessionProvider {
  private sessions: Record<string, string> = {};

  createSession(userId: string) {
    return async () => {
      const sessionId = `session-${userId}`;
      this.sessions[userId] = sessionId;
      return sessionId;
    };
  }
}
