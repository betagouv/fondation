import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { ReportFileService } from '../../gateways/services/report-file-service';

export class GenerateReportFileUrlUseCase {
  constructor(
    private transactionPerformer: TransactionPerformer,
    private reportRepository: ReportRepository,
    private reportFileService: ReportFileService,
  ) {}

  async execute(reportId: string, fileName: string): Promise<string> {
    return this.transactionPerformer.perform(async (trx) => {
      const report = await this.reportRepository.byId(reportId)(trx);
      if (!report) {
        throw new Error(`Report not found by id: ${reportId}`);
      }

      const file = report.attachedFiles?.byName(fileName);
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
