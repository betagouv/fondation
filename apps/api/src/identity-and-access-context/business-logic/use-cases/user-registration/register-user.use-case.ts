import { Gender, Role } from 'shared-models';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserRepository } from '../../gateways/repositories/user-repository';
import { User } from '../../models/user';

export type RegisterUserCommand = {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  gender: Gender | null;
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
        userToRegister.gender,
      );

      await this.userRepository.save(user)(trx);
    };
  }
}
