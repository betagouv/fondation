import { SessionRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/session.repository';
import {
  Session,
  SessionSnapshot,
} from 'src/nominations-context/sessions/business-logic/models/session';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeSessionRepository implements SessionRepository {
  fakeSessions: Record<string, SessionSnapshot> = {};

  save(transparence: Session) {
    return async () => {
      this.fakeSessions[transparence.id] = transparence.snapshot();
    };
  }

  session(id: string): TransactionableAsync<Session | null> {
    return async () => {
      const transparence = this.fakeSessions[id];
      if (!transparence) return null;

      return Session.fromSnapshot(transparence);
    };
  }

  bySessionImportéeId(
    sessionImportéeId: string,
  ): TransactionableAsync<Session | null> {
    return async () => {
      const session = Object.values(this.fakeSessions).find(
        (s) => s.sessionImportéeId === sessionImportéeId,
      );
      if (!session) return null;

      return Session.fromSnapshot(session);
    };
  }
}
