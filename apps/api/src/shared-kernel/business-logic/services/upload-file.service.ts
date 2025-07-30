import { TransparenceFile } from 'src/data-administration-context/transparences/business-logic/models/transparence-file';
import { S3StorageProvider } from 'src/files-context/business-logic/gateways/providers/s3-storage.provider';
import { FileRepository } from 'src/files-context/business-logic/gateways/repositories/file-repository';
import { FilesStorageProvider } from 'src/files-context/business-logic/models/files-provider.enum';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class UploadFileService {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly fileRepository: FileRepository,
    private readonly dateTimeProvider: DateTimeProvider,
    private readonly s3StorageProvider: S3StorageProvider,
  ) {}

  /**
   * The path is formatted as follows:
   * [YEAR-MONTH-DAY, FORMATION, TRANSPARENCE_NAME]
   *
   * @param sessionType
   * @param fileId
   * @param file
   * @param path
   * @returns
   */
  uploadFile({ file, bucket, path }: TransparenceFile) {
    return this.transactionPerformer.perform(async (trx) => {
      await this.fileRepository.create({
        createdAt: this.dateTimeProvider.now(),
        name: file.originalname,
        bucket,
        path,
        storageProvider: FilesStorageProvider.SCALEWAY,
      })(trx);
      await this.s3StorageProvider.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        bucket,
        path,
      );
    });
  }
}
