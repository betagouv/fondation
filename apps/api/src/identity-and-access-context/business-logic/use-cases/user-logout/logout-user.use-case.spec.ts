import {
  FakeSession,
  FakeSessionProvider,
} from 'src/identity-and-access-context/adapters/secondary/gateways/providers/fake-session.provider';
import { FakeUserRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-user-repository';
import { User } from 'src/identity-and-access-context/business-logic/models/user';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { Role } from '../../models/role';
import { LogoutUserUseCase } from './logout-user.use-case';

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

describe('Logout User Use Case', () => {
  let userRepository: FakeUserRepository;
  let sessionProvider: FakeSessionProvider;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    sessionProvider = new FakeSessionProvider();

    userRepository.users = {
      [aUser.id]: aUser.toSnapshot(),
    };

    sessionProvider.setSessions({
      sessionId: 'session-user-id',
      userId: 'user-id',
    });
  });

  it('logs out a user and invalidates its session ID', async () => {
    await logoutUser('session-user-id');
    expectSession({
      sessionId: 'session-user-id',
      userId: 'user-id',
      valid: false,
    });
  });

  const logoutUser = (sessionId: string) =>
    new LogoutUserUseCase(
      sessionProvider,
      new NullTransactionPerformer(),
    ).execute(sessionId);

  const expectSession = (...sessions: FakeSession[]) => {
    expect(Object.values(sessionProvider.sessions)).toEqual(sessions);
  };
});
