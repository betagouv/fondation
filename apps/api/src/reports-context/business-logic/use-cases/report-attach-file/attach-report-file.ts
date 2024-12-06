import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { NonExistingReportError } from '../../errors/non-existing-report.error';
import { ReportAttachedFileRepository } from '../../gateways/repositories/report-attached-file.repository';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { ReportFileService } from '../../gateways/services/report-file-service';

export class AttachReportFileUseCase {
  constructor(
    private readonly reportAttachedFileRepository: ReportAttachedFileRepository,
    private readonly reportFileService: ReportFileService,
    private readonly dateTimeProvider: DateTimeProvider,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly reportRepository: ReportRepository,
    private readonly uuidGenerator: UuidGenerator,
  ) {}

  async execute(
    reportId: string,
    name: string,
    fileBuffer: Buffer,
  ): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const report = await this.reportRepository.byId(reportId)(trx);
      if (!report) throw new NonExistingReportError();

      const filePath = report.generateAttachedFilePath();
      const attachedFile = report.createAttachedFile(
        name,
        this.uuidGenerator.generate(),
        this.dateTimeProvider.now(),
      );
      if (report.alreadyHasAttachedFile(attachedFile)) return;

      // Order matters, file isn't attached if saving in repository fails
      await this.reportAttachedFileRepository.save(attachedFile)(trx);
      console.log('saved attached file');
      await this.reportFileService.uploadFile(
        attachedFile,
        fileBuffer,
        filePath,
      );
      console.log('uploaded file');
    });
  }
}
