import { FakeSessionProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/fake-session.provider';
import { FakeUserRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-user-repository';
import { SessionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/session-provider';
import { User } from 'src/identity-and-access-context/business-logic/models/user';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { Role } from '../../models/role';
import { LoginUserUseCase } from './login-user.use-case';
import { AuthenticationService } from '../../services/authentication.service';
import { FakeEncryptionProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/fake-encryption.provider';
import { DomainRegistry } from '../../models/domain-registry';

const currentDate = new Date(2030, 0, 1);
const aUser = new User(
  'user-id',
  currentDate,
  'user@example.com',
  'encrypted-password',
  Role.MEMBRE_COMMUN,
  'John',
  'Doe',
);

describe('Login User Use Case', () => {
  let userRepository: FakeUserRepository;
  let sessionProvider: SessionProvider;
  let loginUserUseCase: LoginUserUseCase;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    sessionProvider = new FakeSessionProvider();

    const encryptionProvider = new FakeEncryptionProvider();
    encryptionProvider.encryptionMap = {
      password: 'encrypted-password',
    };
    DomainRegistry.setEncryptionProvider(encryptionProvider);

    loginUserUseCase = new LoginUserUseCase(
      sessionProvider,
      new NullTransactionPerformer(),
      new AuthenticationService(userRepository),
    );
  });

  beforeEach(() => {
    userRepository.users = {
      [aUser.id]: aUser.toSnapshot(),
    };
  });

  it('logs in a user and generates a session ID', async () => {
    const result = await loginUserUseCase.execute(
      'user@example.com',
      'password',
    );

    expect(result).toEqual('session-user-id');
  });
});
