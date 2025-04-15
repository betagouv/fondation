import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { S3StorageProvider } from '../../gateways/providers/s3-storage.provider';
import { FileRepository } from '../../gateways/repositories/file-repository';
import { FileVM } from 'shared-models';
import { PermissionsService } from 'src/files-context/business-logic/services/permissions.service';
import { PermissionDeniedError } from '../../errors/permission-denied.error';

export class GenerateFilesUrlsUseCase {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly s3StorageProvider: S3StorageProvider,
    private readonly permissionsService: PermissionsService,
  ) {}

  async execute(ids: string[], userId?: string): Promise<FileVM[]> {
    await this.guardFilesPermissions(ids, userId);

    return this.transactionPerformer.perform(async (trx) => {
      const files = await this.fileRepository.getByIds(ids)(trx);
      const signedUrls = await this.s3StorageProvider.getSignedUrls(files);
      return signedUrls;
    });
  }

  private async guardFilesPermissions(ids: string[], userId?: string) {
    if (!userId) return;

    for (const id of ids) {
      const canReadFile = await this.permissionsService.userCanRead({
        userId,
        fileId: id,
      });
      if (!canReadFile) throw new PermissionDeniedError(id, userId);
    }
  }
}
