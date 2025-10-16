import { Magistrat, User } from 'shared-models';
import { UserRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/user-repository';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class UsersByFormationUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(formation: Magistrat.Formation): Promise<User[]> {
    return this.transactionPerformer.perform(async (trx) => {
      const users = await this.userRepository.usersByFormation(formation)(trx);
      return users.map((user) => {
        return {
          userId: user.id,
          firstName: user.person.fullName.firstName,
          lastName: user.person.fullName.lastName,
          gender: user.person.gender,
          role: user.role,
        };
      });
    });
  }
}
