import { Injectable } from '@nestjs/common';

import { ReportRepository } from './infrastructure/report.repository';
import { FileMimeType } from '../framework/files';
import { ReportFileUsage } from 'shared-models';

@Injectable()
export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async attachFiles(command: {
    userId: string;
    fileUsage: ReportFileUsage;
    reportId: string;
    files: readonly { name: string; type: FileMimeType; buffer: Buffer }[];
  }): Promise<void> {
    const report = await this.reportRepository.find({
      id: command.reportId,
      reporterId: command.userId,
    });
    report.attachFiles({
      reporterId: command.userId,
      fileUsage: command.fileUsage,
      files: command.files,
    });
    await this.reportRepository.persist(report);
  }
}
