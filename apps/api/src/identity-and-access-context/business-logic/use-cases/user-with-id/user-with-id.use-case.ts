import { Injectable } from '@nestjs/common';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserRepository } from '../../gateways/repositories/user-repository';
import {
  UserDescriptor,
  UserDescriptorSerialized,
} from '../../models/user-descriptor';

@Injectable()
export class UserWithIdUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(userId: string): Promise<UserDescriptorSerialized | null> {
    return this.transactionPerformer.perform(async (trx) => {
      const user = await this.userRepository.userWithId(userId)(trx);

      return user ? UserDescriptor.fromUser(user).serialize() : null;
    });
  }
}
