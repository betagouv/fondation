import { SessionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/session-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { AuthenticationService } from '../../services/authentication.service';

export class LoginUserUseCase {
  constructor(
    private readonly sessionProvider: SessionProvider,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly authenticationService: AuthenticationService,
  ) {}

  async execute(email: string, password: string): Promise<string> {
    return this.transactionPerformer.perform(async (trx) => {
      const user = await this.authenticationService.authenticate(
        email,
        password,
      )(trx);
      if (!user) {
        throw new Error('User not found');
      }

      const expiresInDays = 30;
      const sessionId = await this.sessionProvider.createSession(
        user.id,
        expiresInDays,
      )(trx);
      return sessionId;
    });
  }
}
