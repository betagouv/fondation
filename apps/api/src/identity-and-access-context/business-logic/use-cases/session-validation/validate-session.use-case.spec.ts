import { FakeSessionRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-session.repository';
import { FakeUserRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-user-repository';
import { UserSession } from 'src/identity-and-access-context/business-logic/models/session';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { expectUserDescriptor } from 'test/bounded-contexts/identity-and-access';
import { UserBuilder } from '../../builders/user.builder';
import { DomainRegistry } from '../../models/domain-registry';
import { ValidateSessionUseCase } from './validate-session.use-case';

const currentDate = new Date(2030, 0, 10);
const aUser = new UserBuilder()
  .with('email', 'user@example.com')
  .with('password', 'encrypted-password')
  .with('firstName', 'john')
  .with('lastName', 'doe')
  .build();

describe('Validate Session Use Case', () => {
  let sessionRepository: FakeSessionRepository;
  let validateSessionUseCase: ValidateSessionUseCase;
  let userRepository: FakeUserRepository;

  beforeEach(() => {
    sessionRepository = new FakeSessionRepository();
    userRepository = new FakeUserRepository();
    userRepository.users = {
      [aUser.id]: aUser,
    };
    validateSessionUseCase = new ValidateSessionUseCase(
      sessionRepository,
      new NullTransactionPerformer(),
      userRepository,
    );

    const dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    DomainRegistry.setDateTimeProvider(dateTimeProvider);
  });

  it('validates an valid session id', async () => {
    const session = UserSession.create(30, 'valid-session-id', 'user-id');
    sessionRepository.sessions = {
      [session.sessionId]: session,
    };

    const userDescriptor =
      await validateSessionUseCase.execute('valid-session-id');
    expectUserDescriptor(userDescriptor!, aUser);
  });

  it('invalidates an invalid session id', async () => {
    const result = await validateSessionUseCase.execute('invalid-session-id');
    expect(result).toBeNull();
  });
});
