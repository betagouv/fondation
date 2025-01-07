import { UserRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/user-repository';
import {
  User,
  UserSnapshot,
} from 'src/identity-and-access-context/business-logic/models/user';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeUserRepository implements UserRepository {
  users: Record<string, UserSnapshot> = {};

  save(user: User): TransactionableAsync {
    return async () => {
      this.users[user.id] = user.toSnapshot();
    };
  }

  userFromCredentials(
    email: string,
    password: string,
  ): TransactionableAsync<User | null> {
    return async () => {
      const user =
        Object.values(this.users).find(
          (user) => user.email === email && user.password === password,
        ) ?? null;
      return user ? User.fromSnapshot(user) : null;
    };
  }
}
