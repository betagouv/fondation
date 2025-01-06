import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
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
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly domainEventRepository: DomainEventRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userToRegister: RegisterUserCommand): Promise<void> {
    const [user, userRegisteredEvent] = await User.register(
      userToRegister.email,
      userToRegister.password,
      userToRegister.role,
      userToRegister.firstName,
      userToRegister.lastName,
    );

    return this.transactionPerformer.perform(async (trx) => {
      await this.userRepository.save(user)(trx);
      await this.domainEventRepository.save(userRegisteredEvent)(trx);
    });
  }
}
