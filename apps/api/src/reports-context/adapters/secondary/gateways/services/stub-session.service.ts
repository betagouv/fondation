import {
  SessionDto,
  SessionService,
} from 'src/reports-context/business-logic/gateways/services/session.service';

export class StubSessionService implements SessionService {
  stubSession: SessionDto | null = null;

  async session(sessionId: string): Promise<SessionDto | null> {
    if (this.stubSession && this.stubSession.id !== sessionId) {
      return null;
    }
    return this.stubSession;
  }
}
