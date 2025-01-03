import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { S3StorageProvider } from '../../gateways/providers/s3-storage.provider';
import { FileRepository } from '../../gateways/repositories/file-repository';
import { FileVM } from 'shared-models';

export class GenerateFilesUrlsUseCase {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly s3StorageProvider: S3StorageProvider,
  ) {}

  async execute(ids: string[]): Promise<FileVM[]> {
    return this.transactionPerformer.perform(async (trx) => {
      const files = await this.fileRepository.getByIds(ids)(trx);
      const signedUrls = await this.s3StorageProvider.getSignedUrls(files);
      return signedUrls;
    });
  }
}
