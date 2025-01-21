import { FullName } from 'src/identity-and-access-context/business-logic/models/full-name';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserRepository } from '../../gateways/repositories/user-repository';
import { UserDescriptor } from '../../models/user-descriptor';

export class UserWithFullNameUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(fullName: string): Promise<UserDescriptor | null> {
    const name = FullName.unaccentedFromString(fullName);

    return this.transactionPerformer.perform(async (trx) => {
      const user = await this.userRepository.userWithFullName(
        name.firstName,
        name.lastName,
      )(trx);

      return user ? UserDescriptor.fromUser(user) : null;
    });
  }
}
