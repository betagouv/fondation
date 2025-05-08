import { SessionSnapshot } from 'src/nominations-context/business-logic/models/session';
import { SessionService } from 'src/reports-context/business-logic/gateways/services/session.service';

export class StubSessionService implements SessionService {
  sessionSnapshot: SessionSnapshot | null = null;

  async transparence(sessionId: string): Promise<SessionSnapshot | null> {
    if (this.sessionSnapshot && this.sessionSnapshot.id !== sessionId) {
      return null;
    }
    return this.sessionSnapshot;
  }
}
