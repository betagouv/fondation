import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserRepository } from '../../gateways/repositories/user-repository';
import { Role } from '../../models/role';
import { User } from '../../models/user';

export type RegisterUserCommand = {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
};

export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  execute(userToRegister: RegisterUserCommand): TransactionableAsync {
    return async (trx) => {
      const user = await User.register(
        userToRegister.email,
        userToRegister.password,
        userToRegister.role,
        userToRegister.firstName,
        userToRegister.lastName,
      );

      await this.userRepository.save(user)(trx);
    };
  }
}
