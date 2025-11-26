import { Injectable } from '@nestjs/common';

import { ReportRepository } from './infrastructure/report.repository';
import { FileMimeType } from '../framework/files';
import { ReportFileUsage } from 'shared-models';
import {
  GetReportFileUrlsQuery,
  GetReportFileUrlsResponseDto,
} from './infrastructure/queries/get-report-file-urls.query';
import {
  RetrieveReportQuery,
  RetrieveReportResponseDto,
} from './infrastructure/queries/retrieve-report.query';

@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly getReportFileUrlsQuery: GetReportFileUrlsQuery,
    private readonly retrieveReportQuery: RetrieveReportQuery,
  ) {}

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

  async detachFiles(command: {
    userId: string;
    reportId: string;
    fileNames: readonly string[];
  }): Promise<void> {
    const report = await this.reportRepository.find({
      id: command.reportId,
      reporterId: command.userId,
    });
    report.detachFiles({
      fileNames: command.fileNames,
      reporterId: command.userId,
    });
    await this.reportRepository.persist(report);
  }

  getReportFileUrls(query: {
    userId: string;
    reportId: string;
    fileNames: readonly string[];
  }): Promise<GetReportFileUrlsResponseDto> {
    return this.getReportFileUrlsQuery.handle(query);
  }

  retrieveReport(query: {
    reportId: string;
    reporterId: string;
  }): Promise<RetrieveReportResponseDto> {
    return this.retrieveReportQuery.handle(query);
  }
}
