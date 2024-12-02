import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { ReportAttachedFileRepository } from '../../gateways/repositories/report-attached-file.repository';
import { ReportFileService } from '../../gateways/services/report-file-service';

export class DeleteReportAttachedFileUseCase {
  constructor(
    private reportFileRepository: ReportAttachedFileRepository,
    private reportFileService: ReportFileService,
    private transactionPerformer: TransactionPerformer,
  ) {}
  async execute(reportId: string, fileName: string): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const reportAttachedFile = await this.reportFileRepository.byFileName(
        reportId,
        fileName,
      )(trx);
      if (!reportAttachedFile) {
        throw new Error('Report attached file not found');
      }

      await this.reportFileRepository.delete(reportAttachedFile)(trx);
      await this.reportFileService.deleteFile(reportAttachedFile);
    });
  }
}
