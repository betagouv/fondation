import { FakeEncryptionProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/fake-encryption.provider';
import {
  FakeSession,
  FakeSessionProvider,
} from 'src/identity-and-access-context/adapters/secondary/gateways/providers/fake-session.provider';
import { FakeUserRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-user-repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { UserBuilder } from '../../builders/user.builder';
import { DomainRegistry } from '../../models/domain-registry';
import { AuthenticationService } from '../../services/authentication.service';
import { LoginUserUseCase } from './login-user.use-case';
import { expectUserDescriptor } from 'test/bounded-contexts/identity-and-access';

const aUser = new UserBuilder()
  .with('email', 'user@example.com')
  .with('password', 'encrypted-password')
  .with('firstName', 'john')
  .with('lastName', 'doe')
  .build();

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
      [aUser.id]: aUser,
    };
  });

  it('logs in a user and generates a session ID', async () => {
    const { sessionId, userDescriptor } = await loginUser(
      aUser.email,
      'password',
    );
    expect(sessionId).toEqual('session-user-id');
    expectUserDescriptor(userDescriptor, aUser);

    expectSession({
      sessionId: 'session-user-id',
      userId: aUser.id,
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
