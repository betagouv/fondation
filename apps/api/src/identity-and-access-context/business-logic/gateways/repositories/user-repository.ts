import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { User } from '../../models/user';

export interface UserRepository {
  save(user: User): TransactionableAsync;
  userFromCredentials(
    email: string,
    password: string,
  ): TransactionableAsync<User | null>;
}
