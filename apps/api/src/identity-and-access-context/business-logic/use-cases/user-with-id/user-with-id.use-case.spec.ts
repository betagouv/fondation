import { FakeUserRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-user-repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { expectUserDescriptor } from 'test/bounded-contexts/identity-and-access';
import { UserBuilder } from '../../builders/user.builder';
import { UserWithIdUseCase } from './user-with-id.use-case';

const aUser = new UserBuilder()
  .with('id', 'some-user-id')
  .with('firstName', 'john')
  .with('lastName', 'doe')
  .build();

describe('User With ID Use Case', () => {
  let userRepository: FakeUserRepository;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    userRepository.users = {
      [aUser.id]: aUser,
    };
  });

  it('should return a user when found for given ID', async () => {
    const userFound = await userWithId(aUser.id);
    expectUserDescriptor(userFound!, aUser);
  });

  it('should return nothing when user is not found for given ID', async () => {
    const userFound = await userWithId('nonexistent-id');
    expect(userFound).toBeNull();
  });

  const userWithId = (id: string) =>
    new UserWithIdUseCase(
      userRepository,
      new NullTransactionPerformer(),
    ).execute(id);
});
