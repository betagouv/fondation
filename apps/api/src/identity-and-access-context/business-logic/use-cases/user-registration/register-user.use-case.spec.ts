import { FakeUserRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-user-repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { Role } from '../../models/role';
import { UserSnapshot } from '../../models/user';
import { UserRegisteredEvent } from '../../models/user-registered.event';
import {
  RegisterUserCommand,
  RegisterUserUseCase,
} from './register-user.use-case';

const aUserId = 'user-id';
const aUserToRegister: RegisterUserCommand = {
  email: 'user@example.fr',
  password: 'password',
  role: Role.MEMBRE_DU_SIEGE,
  firstName: 'John',
  lastName: 'Doe',
};
const currentDate = new Date(2030, 0, 10);
const anEventId: string = 'event-id';

describe('Register User', () => {
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let userRepository: FakeUserRepository;
  let domainEventRepository: DomainEventRepository;
  let dateTimeProvider: DeterministicDateProvider;

  beforeEach(() => {
    transactionPerformer = new NullTransactionPerformer();
    uuidGenerator = new DeterministicUuidGenerator();
    dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    domainEventRepository = new FakeDomainEventRepository();
    userRepository = new FakeUserRepository();
  });

  it.each`
    userId               | command
    ${aUserId}           | ${aUserToRegister}
    ${'another-user-id'} | ${{ ...aUserToRegister, email: 'other@example.fr' }}
  `('should register a user', async ({ userId, command }) => {
    uuidGenerator.nextUuids = [userId, anEventId];
    await registerUser(command);
    expectRegisteredUser(userId, command);
  });

  it('informs about a new user', async () => {
    uuidGenerator.nextUuids = [aUserId, anEventId];
    await registerUser(aUserToRegister);
    expect(domainEventRepository).toHaveDomainEvents(
      new UserRegisteredEvent(
        anEventId,
        {
          userId: aUserId,
          email: aUserToRegister.email,
          role: aUserToRegister.role,
          firstName: aUserToRegister.firstName,
          lastName: aUserToRegister.lastName,
        },
        currentDate,
      ),
    );
  });

  const registerUser = (command: RegisterUserCommand) =>
    new RegisterUserUseCase(
      transactionPerformer,
      uuidGenerator,
      dateTimeProvider,
      domainEventRepository,
      userRepository,
    ).execute(command);

  const expectRegisteredUser = (
    userId: string,
    command: RegisterUserCommand,
  ) => {
    expect(Object.values(userRepository.users)).toEqual<UserSnapshot[]>([
      {
        id: userId,
        ...command,
      },
    ]);
  };
});
