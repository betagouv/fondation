import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { Readable } from 'stream';
import { ReportAttachedFileRepository } from '../../gateways/repositories/report-attached-file.repository';
import { ReportFileService } from '../../gateways/services/report-file-service';

export class UploadReportAttachedFileUseCase {
  constructor(
    private readonly reportAttachedFileRepository: ReportAttachedFileRepository,
    private readonly uuidGenerator: UuidGenerator,
    private readonly reportFileService: ReportFileService,
  ) {}

  async execute(
    reportId: string,
    name: string,
    fileStream: Readable,
  ): Promise<void> {
    const fileId = await this.reportFileService.uploadFile(name, fileStream);
    await this.reportAttachedFileRepository.save(
      this.uuidGenerator.generate(),
      reportId,
      fileId,
    );
  }
}
