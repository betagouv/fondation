import { FakeEncryptionProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/fake-encryption.provider';
import {
  FakeSession,
  FakeSessionProvider,
} from 'src/identity-and-access-context/adapters/secondary/gateways/providers/fake-session.provider';
import { FakeUserRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-user-repository';
import { User } from 'src/identity-and-access-context/business-logic/models/user';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { DomainRegistry } from '../../models/domain-registry';
import { Role } from '../../models/role';
import { AuthenticationService } from '../../services/authentication.service';
import {
  LoginUserUseCase,
  LoginUserUseCaseResponse,
} from './login-user.use-case';

const currentDate = new Date(2030, 0, 1);
const aUser = new User(
  'user-id',
  currentDate,
  'user@example.com',
  'encrypted-password',
  Role.MEMBRE_COMMUN,
  'john',
  'doe',
);

describe('Login User Use Case', () => {
  let userRepository: FakeUserRepository;
  let sessionProvider: FakeSessionProvider;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    sessionProvider = new FakeSessionProvider();

    const encryptionProvider = new FakeEncryptionProvider();
    encryptionProvider.encryptionMap = {
      password: 'encrypted-password',
    };
    DomainRegistry.setEncryptionProvider(encryptionProvider);
  });

  beforeEach(() => {
    userRepository.users = {
      [aUser.id]: aUser.toSnapshot(),
    };
  });

  it('logs in a user and generates a session ID', async () => {
    expect(
      await loginUser('user@example.com', 'password'),
    ).toEqual<LoginUserUseCaseResponse>({
      sessionId: 'session-user-id',
      userDescriptor: { firstName: 'john', lastName: 'doe' },
    });
    expectSession({
      sessionId: 'session-user-id',
      userId: 'user-id',
      valid: true,
    });
  });

  const loginUser = (email: string, password: string) =>
    new LoginUserUseCase(
      sessionProvider,
      new NullTransactionPerformer(),
      new AuthenticationService(userRepository),
    ).execute(email, password);

  const expectSession = (...sessions: FakeSession[]) => {
    expect(Object.values(sessionProvider.sessions)).toEqual(sessions);
  };
});
