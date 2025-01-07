import { randomUUID } from 'node:crypto';
import { SessionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/session-provider';
import { SessionRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/session-repository';
import { UserSession } from 'src/identity-and-access-context/business-logic/models/session';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class PersistentSessionProvider implements SessionProvider {
  constructor(private readonly sessionRepository: SessionRepository) {}

  createSession(
    userId: string,
    expiresInDays: number,
  ): TransactionableAsync<string> {
    return async (trx) => {
      const sessionId = randomUUID();
      const session = UserSession.create(expiresInDays, sessionId, userId);
      await this.sessionRepository.create(session)(trx);
      return sessionId;
    };
  }

  invalidateSession(sessionId: string): TransactionableAsync {
    return async (trx) => {
      await this.sessionRepository.deleteSession(sessionId)(trx);
    };
  }
}
