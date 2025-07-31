import { GetTransparencesAttachmentDto } from 'shared-models';
import { TransparenceFileRepository } from 'src/data-administration-context/transparence-xlsx/business-logic/gateways/repositories/transparence-file-repository';
import { PartialFileDocumentSnapshot } from 'src/files-context/business-logic/models/file-document';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class GetTransparenceAttachmentsUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceFileRepository: TransparenceFileRepository,
  ) {}

  async execute(
    dto: GetTransparencesAttachmentDto,
  ): Promise<PartialFileDocumentSnapshot[]> {
    return this.transactionPerformer.perform(async (trx) =>
      this.transparenceFileRepository.findBySessionImportId(
        dto.sessionImportId,
      )(trx),
    );
  }
}
