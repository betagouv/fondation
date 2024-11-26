import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { FileRepository } from '../../gateways/repositories/file-repository';
import { FileDocument } from '../../models/file-document';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { S3StorageProvider } from '../../gateways/providers/s3-storage.provider';
import { FilesStorageProvider } from '../../models/files-provider.enum';

export class UploadFileUseCase {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly uuidGenerator: UuidGenerator,
    private readonly dateTimeProvider: DateTimeProvider,
    private readonly s3StorageProvider: S3StorageProvider,
  ) {}

  async execute(
    file: Buffer,
    fileName: string,
    mimeType: string,
    filePath: string[] | null,
  ): Promise<string> {
    await this.s3StorageProvider.uploadFile(file, fileName, mimeType, filePath);

    return this.transactionPerformer.perform(
      async (trx) => {
        const fileDocument = new FileDocument(
          this.uuidGenerator.generate(),
          this.dateTimeProvider.now(),
          fileName,
          filePath,
          FilesStorageProvider.OUTSCALE,
        );
        await this.fileRepository.save(fileDocument)(trx);
        return fileDocument.id;
      },
      async () => this.s3StorageProvider.deleteFile(fileName),
    );
  }
}
