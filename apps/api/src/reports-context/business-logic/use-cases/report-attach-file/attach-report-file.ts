import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { ReportAttachedFileRepository } from '../../gateways/repositories/report-attached-file.repository';
import { ReportFileService } from '../../gateways/services/report-file-service';
import { ReportAttachedFile } from '../../models/report-attached-file';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { NonExistingReportError } from '../../errors/non-existing-report.error';

export class AttachReportFileUseCase {
  constructor(
    private readonly reportAttachedFileRepository: ReportAttachedFileRepository,
    private readonly uuidGenerator: UuidGenerator,
    private readonly reportFileService: ReportFileService,
    private readonly dateTimeProvider: DateTimeProvider,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(
    reportId: string,
    name: string,
    fileBuffer: Buffer,
  ): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const report = await this.reportRepository.byId(reportId)(trx);
      if (!report) throw new NonExistingReportError();

      await this.reportFileService.uploadFile(name, fileBuffer);

      const attachedFile = new ReportAttachedFile(
        this.uuidGenerator.generate(),
        this.dateTimeProvider.now(),
        reportId,
        name,
      );
      await this.reportAttachedFileRepository.save(attachedFile)(trx);
    });
  }
}
