import { SessionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/session-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserDescriptor } from '../../models/user-descriptor';
import { AuthenticationService } from '../../services/authentication.service';

export type LoginUserUseCaseResponse = {
  sessionId: string;
  userDescriptor: UserDescriptor;
};

export class LoginUserUseCase {
  constructor(
    private readonly sessionProvider: SessionProvider,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly authenticationService: AuthenticationService,
  ) {}

  async execute(
    email: string,
    password: string,
  ): Promise<LoginUserUseCaseResponse> {
    return this.transactionPerformer.perform(async () => {
      const user = await this.authenticationService.authenticate(
        email,
        password,
      );
      if (!user) {
        throw new Error('User not found');
      }

      const expiresInDays = 30;
      const sessionId = await this.sessionProvider.createSession(
        user.id,
        expiresInDays,
      );

      return {
        sessionId,
        userDescriptor: UserDescriptor.fromUser(user),
      };
    });
  }
}
