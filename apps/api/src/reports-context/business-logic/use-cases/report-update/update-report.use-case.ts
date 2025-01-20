import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { NominationFileReport } from '../../models/nomination-file-report';

export type ReportUpdateData = Partial<
  Pick<NominationFileReport, 'comment'> & {
    state: NominationFileReport['state'];
  }
>;
export class UpdateReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(id: string, newData: ReportUpdateData) {
    return this.transactionPerformer.perform(async (trx) => {
      const report = await this.reportRepository.byId(id)(trx);
      if (!report) return;

      if ('comment' in newData) report.updateComment(newData.comment);
      if (newData.state) report.updateState(newData.state);

      await this.reportRepository.save(report)(trx);
    });
  }
}
