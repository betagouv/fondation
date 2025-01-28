import { SessionRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/session-repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserRepository } from '../../gateways/repositories/user-repository';
import { UserDescriptor } from '../../models/user-descriptor';

export class ValidateSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(sessionId: string): Promise<UserDescriptor | null> {
    return this.transactionPerformer.perform(async (trx) => {
      const session = await this.sessionRepository.session(sessionId)(trx);
      if (session === null) return null;

      const user = await this.userRepository.userWithId(session.userId)(trx);
      return user ? UserDescriptor.fromUser(user) : null;
    });
  }
}
