import { ImportSessionAttachmentDto } from 'shared-models';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class ImportSessionAttachmentUseCase {
  constructor(private readonly transactionPerformer: TransactionPerformer) {}

  async execute(dto: ImportSessionAttachmentDto, file: File) {
    console.log(dto, file);
  }
}
