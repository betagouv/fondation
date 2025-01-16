import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { User } from '../../models/user';

export interface UserRepository {
  save(user: User): TransactionableAsync;
  userWithEmail(email: string): TransactionableAsync<User | null>;
  userWithFullName(
    firstName: string,
    lastName: string,
  ): TransactionableAsync<User | null>;
}
