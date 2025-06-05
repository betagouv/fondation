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

  async sessionParCriteres(
    nomTransparence: string,
    formation: string,
    dateTransparence: { year: number; month: number; day: number },
  ): Promise<SessionDto | null> {
    if (
      this.stubSession &&
      this.stubSession.name === nomTransparence &&
      this.stubSession.formation === formation &&
      this.stubSession.content.dateTransparence?.year ===
        dateTransparence.year &&
      this.stubSession.content.dateTransparence?.month ===
        dateTransparence.month &&
      this.stubSession.content.dateTransparence?.day === dateTransparence.day
    ) {
      return this.stubSession;
    }
    return null;
  }
}
