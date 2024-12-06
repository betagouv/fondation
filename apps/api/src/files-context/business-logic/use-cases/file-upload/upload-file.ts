import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { S3StorageProvider } from '../../gateways/providers/s3-storage.provider';
import { FileRepository } from '../../gateways/repositories/file-repository';
import { FileDocument } from '../../models/file-document';
import { FilesStorageProvider } from '../../models/files-provider.enum';

export class UploadFileUseCase {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly dateTimeProvider: DateTimeProvider,
    private readonly s3StorageProvider: S3StorageProvider,
  ) {}

  async execute(
    fileId: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
    bucket: string,
    filePath: string[] | null,
  ): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const fileDocument = new FileDocument(
        fileId,
        this.dateTimeProvider.now(),
        fileName,
        bucket,
        filePath,
        FilesStorageProvider.SCALEWAY,
      );
      console.log(
        'files context - created file document',
        fileDocument,
        fileDocument.toSnapshot(),
      );

      // Order matters, file isn't uploaded if saving in repository fails
      await this.fileRepository.save(fileDocument)(trx);
      console.log('files context - saved file');
      await this.s3StorageProvider.uploadFile(
        file,
        fileName,
        mimeType,
        bucket,
        filePath,
      );
      console.log('files context - uploaded file');
    });
  }
}
