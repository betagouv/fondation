import { ImportSessionAttachmentDto, Magistrat } from 'shared-models';
import { IACFileRepository } from 'src/data-administration-context/transparence-xlsx/business-logic/gateways/repositories/iac-file-repository';
import { TransparenceFileRepository } from 'src/data-administration-context/transparence-xlsx/business-logic/gateways/repositories/transparence-file-repository';
import { TransparenceFile } from 'src/data-administration-context/transparences/business-logic/models/transparence-file';
import { FileType } from 'src/identity-and-access-context/business-logic/models/file-type';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UploadFileService } from 'src/shared-kernel/business-logic/services/upload-file.service';

export class ImportSessionAttachmentUseCase {
  constructor(
    private readonly apiConfig: ApiConfig,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly uploadFileService: UploadFileService,
    private readonly transparenceFileRepository: TransparenceFileRepository,
    private readonly IACFileRepository: IACFileRepository,
  ) {}

  async execute(dto: ImportSessionAttachmentDto, file: Express.Multer.File) {
    const transparenceFile = TransparenceFile.from(
      dto.dateSession,
      dto.formation,
      dto.name,
      file,
      this.apiConfig.s3.nominationsContext.transparencesBucketName,
    );
    const { id: fileId } =
      await this.uploadFileService.uploadFile(transparenceFile);

    await this.transactionPerformer.perform(async (trx) => {
      await this.transparenceFileRepository.create(dto.sessionId, fileId)(trx);

      const fileType =
        dto.formation === Magistrat.Formation.PARQUET
          ? FileType.PIECE_JOINTE_TRANSPARENCE_POUR_PARQUET
          : FileType.PIECE_JOINTE_TRANSPARENCE_POUR_SIEGE;

      await this.IACFileRepository.create(fileId, fileType)(trx);
    });
  }
}
