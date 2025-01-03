import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserRepository } from '../../gateways/repositories/user-repository';
import { User } from '../../models/user';
import { Role } from '../../models/role';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';

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
    private readonly uuidGenerator: UuidGenerator,
    private readonly dateTimeProvider: DateTimeProvider,
    private readonly domainEventRepository: DomainEventRepository,
    private readonly userRepository: UserRepository,
  ) {}
  async execute(userToRegister: RegisterUserCommand): Promise<void> {
    const [user, userRegisteredEvent] = User.register(
      this.dateTimeProvider.now(),
      () => this.uuidGenerator.generate(),
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
