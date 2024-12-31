import { UserRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/user-repository';
import { User } from 'src/identity-and-access-context/business-logic/models/user';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeUserRepository implements UserRepository {
  users: Record<string, User> = {};

  save(user: User): TransactionableAsync {
    return async () => {
      this.users[user.id] = user;
    };
  }
}
