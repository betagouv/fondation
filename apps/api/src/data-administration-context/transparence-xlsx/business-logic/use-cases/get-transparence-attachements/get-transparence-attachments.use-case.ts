import { GetTransparencesAttachmentDto } from 'shared-models';
import { TransparenceFileRepository } from 'src/data-administration-context/transparence-xlsx/business-logic/gateways/repositories/transparence-file-repository';
import { PartialFileDocumentSnapshot } from 'src/files-context/business-logic/models/file-document';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UploadFileService } from 'src/shared-kernel/business-logic/services/upload-file.service';

export class GetTransparenceAttachmentsUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceFileRepository: TransparenceFileRepository,
    private readonly uploadFileService: UploadFileService,
  ) {}

  async execute(
    dto: GetTransparencesAttachmentDto,
  ): Promise<PartialFileDocumentSnapshot[]> {
    return this.transactionPerformer.perform(async (trx) => {
      const files = await this.transparenceFileRepository.findBySessionImportId(
        dto.sessionImportId,
      )(trx);

      return Promise.all(
        files.map(async (file) => {
          const signedUrl = await this.uploadFileService.getSignedUrl(file);
          return {
            id: file.id,
            name: file.name,
            signedUrl,
          };
        }),
      );
    });
  }
}
