import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserRepository } from '../../gateways/repositories/user-repository';
import { Role } from 'shared-models';
import { User } from '../../models/user';
import { Gender } from '../../models/gender';

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
