import {
  TransactionPerformer,
  TransactionableAsync,
} from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { DataSource } from 'typeorm';

export class TypeOrmTransactionPerformer implements TransactionPerformer {
  constructor(private readonly dataSource: DataSource) {}

  async perform<T>(useCase: TransactionableAsync<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const useCaseReturn = await useCase(queryRunner);
      await queryRunner.commitTransaction();
      return useCaseReturn;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
