import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { FileRepository } from '../../gateways/repositories/file-repository';
import { S3StorageProvider } from '../../gateways/providers/s3-storage.provider';
export class DeleteFileUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly fileRepository: FileRepository,
    private readonly storageProvider: S3StorageProvider,
  ) {}

  async execute(id: string) {
    return this.transactionPerformer.perform(async (trx) => {
      const files = await this.fileRepository.getByIds([id])(trx);
      const file = files[0]!;

      // Order matters, file isn't deleted if deletion from repository fails
      await this.fileRepository.deleteFile(file)(trx);
      await this.storageProvider.deleteFile(file.bucket, file.path, file.name);
    });
  }
}
