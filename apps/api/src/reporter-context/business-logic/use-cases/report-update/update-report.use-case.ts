import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { NominationFileReport } from '../../models/nomination-file-report';

export type ReportUpdateData = Partial<
  Pick<NominationFileReport, 'biography' | 'comment' | 'state'>
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
      const newReport = new NominationFileReport(
        id,
        newData.biography || report.biography,
        report.dueDate,
        report.name,
        report.birthDate,
        newData.state || report.state,
        report.formation,
        report.transparency,
        report.grade,
        report.currentPosition,
        report.targettedPosition,
        newData.comment || report.comment,
        report.rank,
      );
      await this.reportRepository.save(newReport)(trx);
    });
  }
}
