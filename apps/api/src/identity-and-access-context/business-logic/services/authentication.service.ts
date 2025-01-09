import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserRepository } from '../gateways/repositories/user-repository';
import { DomainRegistry } from '../models/domain-registry';
import { User } from '../models/user';

export class AuthenticationService {
  constructor(private readonly userRepository: UserRepository) {}

  authenticate(
    email: string,
    password: string,
  ): TransactionableAsync<User | null> {
    return async (trx) => {
      const user = await this.userRepository.userWithEmail(email)(trx);
      if (!user) return null;

      const samePassword =
        await DomainRegistry.encryptionProvider().comparePasswords(
          password,
          user.password,
        );

      if (samePassword) return user;
      return null;
    };
  }
}
