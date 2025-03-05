import { ReporterTranslatorService } from 'src/reports-context/adapters/secondary/gateways/services/reporter-translator.service';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { NonExistingReportError } from '../../errors/non-existing-report.error';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { ReportFileService } from '../../gateways/services/report-file-service';

export class AttachReportFileUseCase {
  constructor(
    private readonly reportFileService: ReportFileService,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly reportRepository: ReportRepository,
    private readonly reporterTranslatorService: ReporterTranslatorService,
  ) {}

  async execute(
    reportId: string,
    name: string,
    fileBuffer: Buffer,
    reporterId: string,
  ): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const report = await this.reportRepository.byId(reportId)(trx);
      if (!report) throw new NonExistingReportError();

      const reporter =
        await this.reporterTranslatorService.reporterWithId(reporterId);

      const filePath = report.generateAttachedFilePath(reporter);
      const attachedFile = report.createAttachedFile(name);

      // Order matters, file isn't attached if saving in repository fails
      await this.reportRepository.save(report)(trx);
      await this.reportFileService.uploadFile(
        attachedFile,
        fileBuffer,
        filePath,
      );
    });
  }
}
