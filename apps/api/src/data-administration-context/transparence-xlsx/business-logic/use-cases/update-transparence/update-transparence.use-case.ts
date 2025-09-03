import { EditTransparencyDto } from 'shared-models';
import { TransparenceService } from 'src/data-administration-context/transparence-xlsx/business-logic/services/transparence.service';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class UpdateTransparenceUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly transparenceService: TransparenceService,
  ) {}

  async execute(sessionId: string, dto: EditTransparencyDto) {
    return this.transactionPerformer.perform(async (trx) => {
      return this.transparenceService.updateMetadata(sessionId, dto)(trx);
    });
  }
}
