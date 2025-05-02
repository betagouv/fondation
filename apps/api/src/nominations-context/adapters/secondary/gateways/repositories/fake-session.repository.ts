import { SessionRepository } from 'src/nominations-context/business-logic/gateways/repositories/session.repository';
import {
  Session,
  SessionSnapshot,
} from 'src/nominations-context/business-logic/models/session';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeSessionRepository implements SessionRepository {
  sessions: Record<string, SessionSnapshot> = {};

  save(transparence: Session) {
    return async () => {
      this.sessions[transparence.id] = transparence.snapshot();
    };
  }

  session(id: string): TransactionableAsync<Session | null> {
    return async () => {
      const transparence = this.sessions[id];
      if (!transparence) return null;

      return Session.fromSnapshot(transparence);
    };
  }
}
