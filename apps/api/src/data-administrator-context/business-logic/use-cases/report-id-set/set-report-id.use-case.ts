import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { NominationFileRepository } from '../../gateways/repositories/nomination-file-repository';

export class SetReportIdUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly nominationFileRepository: NominationFileRepository,
  ) {}

  execute(nominationFileId: string, reportId: string): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      await this.nominationFileRepository.setReportId(
        nominationFileId,
        reportId,
      )(trx);
    });
  }
}
