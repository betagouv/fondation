import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { ReportAttachedFileRepository } from '../../gateways/repositories/report-attached-file.repository';
import { ReportFileService } from '../../gateways/services/report-file-service';

export class GenerateReportFileUrlUseCase {
  constructor(
    private transactionPerformer: TransactionPerformer,
    private reportAttachedFileRepository: ReportAttachedFileRepository,
    private reportFileService: ReportFileService,
  ) {}

  async execute(reportId: string, fileName: string): Promise<string> {
    return this.transactionPerformer.perform(async (trx) => {
      const file = await this.reportAttachedFileRepository.byFileName(
        reportId,
        fileName,
      )(trx);
      if (!file) {
        throw new Error(
          `File not found by name: ${fileName} and report id: ${reportId}`,
        );
      }

      const { signedUrl } = await this.reportFileService.getSignedUrl(file);
      return signedUrl;
    });
  }
}
