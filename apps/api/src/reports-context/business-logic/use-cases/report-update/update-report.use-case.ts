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
      const newReport = new NominationFileReport(
        id,
        report.nominationFileId,
        report.createdAt,
        report.reporterId,
        report.folderNumber,
        report.biography,
        report.dueDate,
        report.name,
        report.birthDate,
        newData.state || report.state,
        report.formation,
        report.transparency,
        report.grade,
        report.currentPosition,
        report.targettedPosition,
        'comment' in newData
          ? newData.comment === ''
            ? null
            : newData.comment || null
          : report.comment,
        report.rank,
        report.observers,
        null,
      );
      await this.reportRepository.save(newReport)(trx);
    });
  }
}
