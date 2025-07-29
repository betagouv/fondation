import { SessionType } from 'shared-models';
import { S3StorageProvider } from 'src/files-context/business-logic/gateways/providers/s3-storage.provider';
import { FileRepository } from 'src/files-context/business-logic/gateways/repositories/file-repository';
import { FileDocument } from 'src/files-context/business-logic/models/file-document';
import { FilesStorageProvider } from 'src/files-context/business-logic/models/files-provider.enum';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class UploadFileService {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly fileRepository: FileRepository,
    private readonly dateTimeProvider: DateTimeProvider,
    private readonly s3StorageProvider: S3StorageProvider,
    private readonly apiConfig: ApiConfig,
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
  uploadFile(
    sessionType: SessionType,
    fileId: string,
    file: Express.Multer.File,
  ) {
    let bucket: string;
    switch (sessionType) {
      case SessionType.TRANSPARENCE:
        bucket = this.apiConfig.s3.nominationsContext.transparencesBucketName;
        break;
      default:
        throw new Error('Invalid session type');
    }

    const path: string[] = [];

    return this.transactionPerformer.perform(async (trx) => {
      const fileDocument = new FileDocument(
        fileId,
        this.dateTimeProvider.now(),
        file.originalname,
        bucket,
        path,
        FilesStorageProvider.SCALEWAY,
      );

      await this.fileRepository.save(fileDocument)(trx);
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
