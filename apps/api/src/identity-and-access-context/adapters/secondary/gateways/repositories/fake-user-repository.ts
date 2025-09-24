import { deburr } from 'lodash';
import { Magistrat, Role } from 'shared-models';
import { UserRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/user-repository';
import {
  User,
  UserSnapshot,
} from 'src/identity-and-access-context/business-logic/models/user';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class FakeUserRepository implements UserRepository {
  users: Record<string, UserSnapshot> = {};

  usersByFormation(
    formation: Magistrat.Formation,
  ): TransactionableAsync<User[]> {
    return async () => {
      return Object.values(this.users)
        .filter((user) => {
          if (user.role === Role.MEMBRE_DU_PARQUET) {
            return formation === Magistrat.Formation.PARQUET;
          }
          if (user.role === Role.MEMBRE_DU_SIEGE) {
            return formation === Magistrat.Formation.SIEGE;
          }
          return user.role === Role.MEMBRE_COMMUN;
        })
        .map(User.fromSnapshot);
    };
  }

  save(user: User): TransactionableAsync {
    return async () => {
      this.users[user.id] = user.toSnapshot();
    };
  }

  userWithEmail(email: string): TransactionableAsync<User | null> {
    return async () => {
      const user = Object.values(this.users).find(
        (user) => user.email === email,
      );
      return user ? User.fromSnapshot(user) : null;
    };
  }

  userWithFullName(
    firstName: string,
    lastName: string,
  ): TransactionableAsync<User | null> {
    return async () => {
      const user = Object.values(this.users).find(
        (user) =>
          deburr(user.firstName) === firstName &&
          deburr(user.lastName) === lastName,
      );
      return user ? User.fromSnapshot(user) : null;
    };
  }

  userWithId(userId: string): TransactionableAsync<User | null> {
    return async () => {
      const user = this.users[userId];
      return user ? User.fromSnapshot(user) : null;
    };
  }

  addUser(user: UserSnapshot): void {
    this.users[user.id] = user;
  }
}
