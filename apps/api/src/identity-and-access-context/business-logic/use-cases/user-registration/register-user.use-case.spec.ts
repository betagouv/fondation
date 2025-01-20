import { FakeEncryptionProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/fake-encryption.provider';
import { FakeUserRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-user-repository';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserBuilder } from '../../builders/user.builder';
import { DomainRegistry } from '../../models/domain-registry';
import { UserSnapshot } from '../../models/user';
import {
  RegisterUserCommand,
  RegisterUserUseCase,
} from './register-user.use-case';

const expectedEncryptedPassword = 'encrypted-password';
const currentDate = new Date(2030, 0, 10);
const userBuilder = new UserBuilder('fake', { createdAt: currentDate });

describe('Register User', () => {
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let userRepository: FakeUserRepository;
  let dateTimeProvider: DeterministicDateProvider;
  let encryptionProvider: FakeEncryptionProvider;

  beforeEach(() => {
    transactionPerformer = new NullTransactionPerformer();
    userRepository = new FakeUserRepository();

    uuidGenerator = new DeterministicUuidGenerator();
    dateTimeProvider = new DeterministicDateProvider();
    dateTimeProvider.currentDate = currentDate;
    encryptionProvider = new FakeEncryptionProvider();

    DomainRegistry.setUuidGenerator(uuidGenerator);
    DomainRegistry.setDateTimeProvider(dateTimeProvider);
    DomainRegistry.setEncryptionProvider(encryptionProvider);
  });

  it.each([
    {
      testName: '',
      userBuilder: userBuilder,
      expectedUserBuilder: userBuilder,
    },
    {
      testName: 'with capital letters and special characters in name',
      userBuilder: userBuilder
        .with('firstName', 'Adèle')
        .with('lastName', 'PEREZ-LODEON'),
      expectedUserBuilder: userBuilder
        .with('firstName', 'adèle')
        .with('lastName', 'perez-lodeon'),
    },
    {
      testName: 'with other information',
      userBuilder: userBuilder.with('email', 'other@example.fr'),
      expectedUserBuilder: userBuilder.with('email', 'other@example.fr'),
    },
  ])(
    'should register a user $testName',
    async ({ userBuilder, expectedUserBuilder }) => {
      const userCommand = userBuilder.buildRegisterUserCommand();
      givenADeterministicUserId();
      givenAPasswordEncryption();

      await registerUser(userCommand);

      const expectedUser = expectedUserBuilder
        .with('password', expectedEncryptedPassword)
        .build();
      expectRegisteredUser(expectedUser);
    },
  );

  const givenADeterministicUserId = () => {
    uuidGenerator.nextUuids = [userBuilder.build().id];
  };

  const givenAPasswordEncryption = () => {
    encryptionProvider.encryptionMap = {
      [userBuilder.build().password]: expectedEncryptedPassword,
    };
  };

  const registerUser = (command: RegisterUserCommand) =>
    transactionPerformer.perform(
      new RegisterUserUseCase(userRepository).execute(command),
    );

  const expectRegisteredUser = (user: UserSnapshot) =>
    expect(Object.values(userRepository.users)).toEqual<UserSnapshot[]>([user]);
});
