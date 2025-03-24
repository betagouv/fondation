import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { FileRepository } from '../../gateways/repositories/file-repository';
import { S3StorageProvider } from '../../gateways/providers/s3-storage.provider';
import { FileDocument } from '../../models/file-document';
import { FilesStorageProvider } from '../../models/files-provider.enum';
import { UploadFilesError } from '../../errors/upload-files.error';

export class UploadFilesUseCase {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly dateTimeProvider: DateTimeProvider,
    private readonly storageProvider: S3StorageProvider,
  ) {}

  async execute(
    files: Array<{
      fileId: string;
      file: Buffer;
      fileName: string;
      mimeType: string;
      bucket: string;
      filePath: string[] | null;
    }>,
    retries: number = 0,
  ): Promise<void> {
    if (files.length === 0) return;

    return this.transactionPerformer.perform(
      async (trx) => {
        const fileDocuments = files.map(
          ({ fileId, fileName, bucket, filePath }) =>
            new FileDocument(
              fileId,
              this.dateTimeProvider.now(),
              fileName,
              bucket,
              filePath,
              FilesStorageProvider.SCALEWAY,
            ),
        );

        for (const fileDocument of fileDocuments) {
          await this.fileRepository.save(fileDocument)(trx);
        }

        const { hasUploadingFailures, results } =
          await this.uploadS3Files(files);
        if (!hasUploadingFailures) return;

        await this.cleanUpS3Files(fileDocuments, results);
        throw new UploadFilesError(
          files.filter((_, index) => results[index]?.status === 'rejected'),
        );
      },
      {
        retries,
      },
    );
  }

  private async uploadS3Files(
    files: Array<{
      file: Buffer;
      fileName: string;
      mimeType: string;
      bucket: string;
      filePath: string[] | null;
    }>,
  ) {
    const results = await this.storageProvider.uploadFiles(
      files.map(({ file, fileName, mimeType, bucket, filePath }) => ({
        file,
        fileName,
        mimeType,
        bucket,
        filePath,
      })),
    );

    const hasUploadingFailures = results.some(
      (result) => result.status === 'rejected',
    );

    return { hasUploadingFailures, results };
  }

  private async cleanUpS3Files(
    files: FileDocument[],
    results: PromiseSettledResult<void>[],
  ) {
    const filesToDelete = files.filter(
      (_, index) => results[index]?.status === 'fulfilled',
    );

    if (filesToDelete.length === 0) return;

    await this.storageProvider.deleteFiles(filesToDelete);
  }
}
