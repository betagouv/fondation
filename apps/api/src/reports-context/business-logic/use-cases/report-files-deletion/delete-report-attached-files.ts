import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { ReportFileService } from '../../gateways/services/report-file-service';

export class DeleteReportAttachedFilesUseCase {
  constructor(
    private reportRepository: ReportRepository,
    private reportFileService: ReportFileService,
    private transactionPerformer: TransactionPerformer,
  ) {}

  async execute(reportId: string, fileNames: string[]): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const report = await this.reportRepository.byId(reportId)(trx);
      if (!report) {
        throw new Error('Report not found');
      }

      const deletedFiles = report.deleteAttachedFilesByNames(fileNames);

      if (deletedFiles.length > 0) {
        await this.reportRepository.save(report)(trx);
        await this.reportFileService.deleteFiles(deletedFiles);
      }
    });
  }
}
