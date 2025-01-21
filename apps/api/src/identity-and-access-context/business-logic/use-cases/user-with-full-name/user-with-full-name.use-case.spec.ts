import { FakeUserRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-user-repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { expectUserDescriptor } from 'test/bounded-contexts/identity-and-access';
import { UserBuilder } from '../../builders/user.builder';
import { UserWithFullNameUseCase } from './user-with-full-name.use-case';

const aUser = new UserBuilder()
  .with('firstName', 'john')
  .with('lastName', 'prégent')
  .build();

const composedLastNameUser = new UserBuilder()
  .with('id', 'composed-last-name-user-id')
  .with('firstName', 'jane')
  .with('lastName', 'doe smith')
  .build();

describe('User With Full Name Use Case', () => {
  let userRepository: FakeUserRepository;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    userRepository.users = {
      [aUser.id]: aUser,
      [composedLastNameUser.id]: composedLastNameUser,
    };
  });

  it.each([
    ['pregent john'],
    ['prégent john'],
    ['  prégent   john  '],
    ['Prégent John'],
    ['PRÉGENT JOHN'],
    ['PREGENT JOHN'],
  ])('should return a user when found for full name %s', async (fullName) => {
    const userFound = await userByFullName(fullName);
    expectUserDescriptor(userFound!, aUser);
  });

  it.each([['John Prégent'], ['john prégent'], ['JOHN PREGENT']])(
    'should return nothing when user is not found for full name %s',
    async (fullName) => {
      const userFound = await userByFullName(fullName);
      expect(userFound).toBeNull();
    },
  );

  it('should return a user when found for a composed last name', async () => {
    const userFound = await userByFullName('doe smith jane');
    expectUserDescriptor(userFound!, composedLastNameUser);
  });

  const userByFullName = (fullName: string) =>
    new UserWithFullNameUseCase(
      userRepository,
      new NullTransactionPerformer(),
    ).execute(fullName);
});
