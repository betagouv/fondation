import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { FileRepository } from '../../gateways/repositories/file-repository';
import { S3StorageProvider } from '../../gateways/providers/s3-storage.provider';
import { FileDocument, FileDocumentSnapshot } from '../../models/file-document';
import { DeleteFilesError } from '../../errors/delete-files.error';

export class DeleteFilesUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly fileRepository: FileRepository,
    private readonly storageProvider: S3StorageProvider,
  ) {}

  async execute(fileIds: string[], retries: number = 0): Promise<void> {
    if (fileIds.length === 0) return;

    return this.transactionPerformer.perform(
      async (trx) => {
        const files = await this.fileRepository.getByIds(fileIds)(trx);
        const filesBackup = files.map((file) => file.toSnapshot());

        await this.fileRepository.deleteFiles(files)(trx);
        const { hasUploadingFailures: hasUploadFilesFailures, results } =
          await this.deleteS3Files(files);
        if (!hasUploadFilesFailures) return;

        await this.restoreS3Files(filesBackup, results);
      },
      {
        retries,
      },
    );
  }

  private async restoreS3Files(
    filesBackup: FileDocumentSnapshot[],
    results: PromiseSettledResult<void>[],
  ) {
    const filesToRestore = this.filesToRestore(filesBackup, results);

    await this.storageProvider.restoreFiles(
      filesToRestore.map((file) => FileDocument.fromSnapshot(file)),
    );

    throw new DeleteFilesError(filesToRestore);
  }

  private async deleteS3Files(files: FileDocument[]) {
    const results = await this.storageProvider.deleteFiles(files);

    const hasUploadingFailures = results.some(
      (result) => result.status === 'rejected',
    );

    return { hasUploadingFailures, results };
  }

  private filesToRestore(
    filesBackup: FileDocumentSnapshot[],
    results: PromiseSettledResult<void>[],
  ) {
    return filesBackup.filter((_, index) =>
      results.some(
        (result, resultIndex) =>
          result.status === 'fulfilled' && resultIndex === index,
      ),
    );
  }
}
